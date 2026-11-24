<?php

namespace App\Services;

use App\Models\BankLedgerEntry;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class FaturaLedgerService
{
    /**
     * Appends an immutable payment/reversal event for a fatura and recomputes its
     * cached total_paid from the event log. This is the ONLY place allowed to write
     * Fatura::total_paid.
     */
    public function recordPaymentEvent(
        Fatura $fatura,
        string|int|float $amount,
        string $type,
        ?Transacao $transacao = null,
        ?BankLedgerEntry $bankLedgerEntry = null,
        ?string $description = null
    ): FaturaPaymentEvent {
        return $this->recordPaymentEventCents($fatura, Money::fromDecimal($amount), $type, $transacao, $bankLedgerEntry, $description);
    }

    /**
     * Mesmo que recordPaymentEvent(), com o valor já em centavos (sempre positivo;
     * o tipo diz se é pagamento ou estorno).
     */
    public function recordPaymentEventCents(
        Fatura $fatura,
        int $amountCents,
        string $type,
        ?Transacao $transacao = null,
        ?BankLedgerEntry $bankLedgerEntry = null,
        ?string $description = null
    ): FaturaPaymentEvent {
        return DB::transaction(function () use ($fatura, $amountCents, $type, $transacao, $bankLedgerEntry, $description) {
            $event = FaturaPaymentEvent::create([
                'fatura_id' => $fatura->id,
                'transacao_id' => $transacao?->id,
                'bank_ledger_entry_id' => $bankLedgerEntry?->id,
                'type' => $type,
                'amount' => Money::toDecimal($amountCents),
                'description' => $description,
                'created_at' => now(),
            ]);

            $fatura->total_paid = Money::toDecimal($this->totalPaidCents($fatura->id));
            $fatura->save();

            return $event;
        });
    }

    public function totalPaid(int $faturaId): float
    {
        return $this->totalPaidCents($faturaId) / 100;
    }

    /** Pagamentos menos estornos da fatura, em centavos, nunca negativo. */
    public function totalPaidCents(int $faturaId): int
    {
        $payments = $this->sumCents($faturaId, FaturaPaymentEvent::TYPE_PAYMENT);
        $reversals = $this->sumCents($faturaId, FaturaPaymentEvent::TYPE_REVERSAL);

        return max(0, $payments - $reversals);
    }

    private function sumCents(int $faturaId, string $type): int
    {
        $sum = FaturaPaymentEvent::forFatura($faturaId)->where('type', $type)->sum('amount');

        return Money::fromDecimal($sum);
    }
}
