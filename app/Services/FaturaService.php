<?php

namespace App\Services;

use App\Contracts\Services\FaturaServiceInterface;
use App\Enums\TransacaoParcelaStatus;
use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaService implements FaturaServiceInterface
{
    public function __construct(
        private FaturaBillingService $billing,
        private BankLedgerService $ledger,
        private FaturaLedgerService $faturaLedger,
    ) {}

    public function createForUser(Authenticatable $user, array $data): Transacao
    {
        $debitAccountId = $data['debit_account_id'] ?? null;
        unset($data['debit_account_id']);

        $data['user_id'] = $user->id;
        $data['total_installments'] = max($data['total_installments'] ?? 1, 1);
        $data['current_installment'] = 0;
        $data['status'] = $data['status'] ?? TransacaoStatus::Unpaid;
        $data['is_recurring'] = $data['is_recurring'] ?? false;

        if ($data['is_recurring']) {
            $data['total_installments'] = 1;
            $data['current_installment'] = 0;
        }

        if (($data['type'] ?? null) === TransacaoType::Debit->value) {
            $data['status'] = TransacaoStatus::Paid;
            $data['paid_date'] = Carbon::today()->toDateString();
            $data['total_installments'] = 1;
            $data['current_installment'] = 1;
            $data['is_recurring'] = false;
        }

        $amountCents = Money::fromDecimal($data['amount'] ?? 0);

        return DB::transaction(function () use ($data, $debitAccountId, $user, $amountCents) {
            $fatura = Transacao::create($data);

            $this->createParcelas($fatura);

            if ($debitAccountId && $amountCents > 0) {
                // Lê o saldo com a linha travada: duas compras simultâneas não podem
                // calcular o teto do débito sobre o mesmo saldo.
                $bankAccount = BankUser::forUser($user->id)->lockForUpdate()->findOrFail($debitAccountId);
                $debitCents = min($amountCents, max(0, Money::fromDecimal((string) $bankAccount->balance)));

                if ($debitCents > 0) {
                    $this->ledger->recordCents(
                        $bankAccount,
                        BankLedgerEntry::TYPE_DEBIT_PURCHASE,
                        -$debitCents,
                        $fatura,
                        "Compra no débito: {$fatura->title}"
                    );
                }
            }

            return $fatura;
        });
    }

    public function updateForUser(Transacao $fatura, array $data): Transacao
    {
        return DB::transaction(function () use ($fatura, $data) {
            $oldAmountCents = Money::fromDecimal((string) $fatura->amount);
            $oldInstallments = (int) $fatura->total_installments;
            $wasPaid = $fatura->paid_date !== null;
            $wasRecurring = (bool) $fatura->is_recurring;

            $fatura->update($data);

            if ($fatura->is_recurring) {
                $fatura->total_installments = 1;
                $fatura->current_installment = 0;
                $fatura->paid_date = null;
                $fatura->save();
            }

            $newAmountCents = Money::fromDecimal((string) $fatura->amount);
            $newInstallments = (int) $fatura->total_installments;

            if ($oldAmountCents !== $newAmountCents || $oldInstallments !== $newInstallments) {
                $fatura->parcelas()->delete();
                $this->createParcelas($fatura);
            }

            if ($wasPaid && $fatura->paid_date === null && ! $wasRecurring) {
                $this->resetFaturaPaymentOnUnpaid($fatura);
            }

            return $fatura->refresh();
        });
    }

    private function resetFaturaPaymentOnUnpaid(Transacao $transacao): void
    {
        $transacao->loadMissing(['bankUser', 'parcelas']);
        $parcelas = $transacao->parcelas;

        $transacao->parcelas()
            ->where('status', TransacaoParcelaStatus::Paid)
            ->update(['status' => TransacaoParcelaStatus::Pending, 'paid_date' => null]);

        $transacao->current_installment = 0;
        $transacao->save();

        if ($parcelas->isNotEmpty()) {
            $entries = $parcelas
                ->filter(fn ($p) => $p->month_key !== null)
                ->map(fn ($p) => ['month_key' => $p->month_key, 'cents' => Money::fromDecimal((string) $p->amount)])
                ->values();
        } else {
            try {
                $monthKey = $this->billing->resolveBillingMonthKey($transacao);
            } catch (\Throwable) {
                $monthKey = $transacao->created_at->format('Y-m');
            }
            $entries = collect([['month_key' => $monthKey, 'cents' => Money::fromDecimal((string) $transacao->amount)]]);
        }

        foreach ($entries as $entry) {
            $faturaRecord = Fatura::where([
                'user_id' => $transacao->user_id,
                'month_key' => $entry['month_key'],
                'bank_user_id' => $transacao->bank_user_id,
            ])->first();

            if (! $faturaRecord) {
                continue;
            }

            $this->faturaLedger->recordPaymentEventCents(
                $faturaRecord,
                $entry['cents'],
                FaturaPaymentEvent::TYPE_REVERSAL,
                $transacao,
                null,
                'Fatura reaberta: pagamento revertido'
            );

            if (Money::fromDecimal((string) $faturaRecord->total_paid) <= 0) {
                $faturaRecord->paid_at = null;
                $faturaRecord->total_paid = 0;
                $faturaRecord->save();
            }
        }
    }

    public function createParcelas(Transacao $transacao): void
    {
        $totalInstallments = max((int) $transacao->total_installments, 1);
        $totalAmount = Money::toDecimal(Money::fromDecimal((string) $transacao->amount));

        $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($transacao);

        if ($totalInstallments <= 1 && ! $transacao->is_recurring) {
            TransacaoParcela::create([
                'transacao_id' => $transacao->id,
                'installment_number' => 1,
                'amount' => $totalAmount,
                'due_date' => $transacao->created_at
                    ? $transacao->created_at->toDateString()
                    : Carbon::today()->toDateString(),
                'month_key' => $firstBillingMonthKey,
                'status' => $transacao->status === TransacaoStatus::Paid ? TransacaoParcelaStatus::Paid : TransacaoParcelaStatus::Pending,
                'paid_date' => $transacao->status === TransacaoStatus::Paid ? ($transacao->paid_date ?? now())->toDateString() : null,
            ]);

            return;
        }

        if ($transacao->is_recurring) {
            return;
        }

        $now = now();
        $parcelas = array_map(fn (array $row) => $row + [
            'transacao_id' => $transacao->id,
            'status' => TransacaoParcelaStatus::Pending->value,
            'paid_date' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ], $this->buildInstallmentSchedule($transacao));

        TransacaoParcela::insert($parcelas);
    }

    /**
     * Cronograma esperado de uma compra parcelada: número, valor, vencimento e
     * mês de fatura de cada parcela. Usado ao criar parcelas e para conferir
     * parcelas já gravadas.
     *
     * O total é dividido em centavos com Money::split: as parcelas somam exatamente
     * o valor da compra e o centavo que sobra vai para as primeiras parcelas
     * (R$ 100,00 em 3 = 33,34 + 33,33 + 33,33).
     *
     * @return array<int, array{installment_number: int, amount: string, due_date: string, month_key: string}>
     */
    public function buildInstallmentSchedule(Transacao $transacao): array
    {
        $totalInstallments = max((int) $transacao->total_installments, 1);
        $amounts = Money::split(Money::fromDecimal((string) $transacao->amount), $totalInstallments);
        $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($transacao);

        $createdAt = $transacao->created_at
            ? ($transacao->created_at instanceof Carbon ? $transacao->created_at : Carbon::parse($transacao->created_at))
            : Carbon::today();

        $cardUser = $transacao->bank_user_id
            ? CardUser::find($transacao->bank_user_id)
            : null;

        $dueDay = $cardUser->due_day ?? $cardUser->closing_day ?? (int) $createdAt->format('d');

        $firstBillingMonth = Carbon::parse($firstBillingMonthKey.'-01');

        $parcelas = [];
        for ($i = 1; $i <= $totalInstallments; $i++) {
            $parcelMonth = $firstBillingMonth->copy()->addMonthsNoOverflow($i - 1);
            $monthKey = $parcelMonth->format('Y-m');
            $maxDay = (int) $parcelMonth->copy()->endOfMonth()->format('d');
            $actualDueDay = min($dueDay, $maxDay);
            $dueDate = $parcelMonth->copy()->setDay($actualDueDay);

            $parcelas[] = [
                'installment_number' => $i,
                'amount' => Money::toDecimal($amounts[$i - 1]),
                'due_date' => $dueDate->toDateString(),
                'month_key' => $monthKey,
            ];
        }

        return $parcelas;
    }

    public function deleteForUser(Transacao $fatura): bool
    {
        return DB::transaction(function () use ($fatura) {
            return $fatura->delete();
        });
    }
}
