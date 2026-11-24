<?php

namespace App\Queries\Export;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Generator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Linhas de exportação: uma por débito e uma por mês de fatura de cada compra
 * no cartão (parcela gravada, parcela calculada ou mês de recorrência até hoje).
 *
 * Lê os lançamentos em blocos (lazy) com as relações carregadas por bloco, para
 * a exportação não carregar tudo na memória. É a base das planilhas e do JSON
 * de FaturaExportService::exportForUser.
 */
class ExportRowsQuery
{
    public const CHUNK_SIZE = 500;

    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @param  bool  $newestFirst  true: mais recentes primeiro (ordem do JSON da tela);
     *                             false: mais antigos primeiro (ordem das planilhas)
     * @return Generator<int, array<string, mixed>>
     */
    public function rows(int $userId, ExportFilters $filters, bool $newestFirst = false): Generator
    {
        $direction = $newestFirst ? 'desc' : 'asc';
        $currentMonth = Carbon::today()->format('Y-m');

        $transactions = $this->query($userId, $filters)
            ->orderBy('created_at', $direction)
            ->orderBy('id', $direction)
            ->lazy(self::CHUNK_SIZE);

        foreach ($transactions as $transacao) {
            foreach ($this->expand($transacao, $currentMonth) as $row) {
                if ($filters->matchesRow($row)) {
                    yield $row;
                }
            }
        }
    }

    /**
     * @return Builder<Transacao>
     */
    private function query(int $userId, ExportFilters $filters): Builder
    {
        return Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->forUser($userId)
            ->forBankUser($filters->bankUserId)
            ->when($filters->categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function expand(Transacao $transacao, string $currentMonth): array
    {
        if ($transacao->type === TransacaoType::Debit) {
            return [$this->buildRow($transacao)];
        }

        $isRecurring = (bool) $transacao->is_recurring;
        $rows = [];

        if (! $isRecurring && $transacao->parcelas->isNotEmpty()) {
            foreach ($transacao->parcelas as $parcela) {
                $row = $this->buildRow($transacao, $parcela->month_key, $parcela->installment_number, (float) $parcela->amount);
                $row['parcela_status'] = $parcela->status->value;
                $row['due_date'] = $parcela->due_date->toDateString();
                $rows[] = $row;
            }

            return $rows;
        }

        $cursor = Carbon::parse($this->billing->resolveBillingMonthKey($transacao).'-01');

        if ($isRecurring) {
            while ($cursor->format('Y-m') <= $currentMonth) {
                $rows[] = $this->buildRow($transacao, $cursor->format('Y-m'), null, (float) $transacao->getInstallmentAmount());
                $cursor->addMonthNoOverflow();
            }

            return $rows;
        }

        $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
        for ($i = 1; $i <= $totalInstallments; $i++) {
            $rows[] = $this->buildRow($transacao, $cursor->format('Y-m'), $i, (float) $transacao->getInstallmentAmount($i));
            $cursor->addMonthNoOverflow();
        }

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildRow(
        Transacao $fatura,
        ?string $overrideInvoiceMonth = null,
        ?int $displayInstallment = null,
        ?float $installmentAmount = null,
    ): array {
        $createdAt = $fatura->created_at;
        $yearMonth = $createdAt ? $createdAt->format('Y-m') : null;
        $monthLabel = $createdAt ? ucfirst($createdAt->translatedFormat('F Y')) : null;
        $createdAtFormatted = $createdAt ? $createdAt->format('d/m/Y H:i') : null;

        if ($fatura->type === TransacaoType::Credit) {
            $invoiceMonthKey = $overrideInvoiceMonth ?? $this->billing->resolveBillingMonthKey($fatura);
            $invoiceMonthLabel = ucfirst(Carbon::parse($invoiceMonthKey.'-01')->translatedFormat('F Y'));
            $computedInstallmentAmount = $installmentAmount ?? ((float) $fatura->getInstallmentAmount());
        } else {
            $invoiceMonthKey = $yearMonth;
            $invoiceMonthLabel = $monthLabel;
            $computedInstallmentAmount = (float) $fatura->amount;
        }

        return [
            'id' => (string) $fatura->id,
            'title' => $fatura->title,
            'description' => $fatura->description,
            'amount' => (float) $fatura->amount,
            'type' => $fatura->type->value,
            'status' => $fatura->status->value,
            'created_at' => $fatura->created_at,
            'total_installments' => $fatura->total_installments,
            'current_installment' => $fatura->current_installment,
            'display_installment' => $displayInstallment,
            'is_recurring' => (bool) $fatura->is_recurring,
            'year_month' => $yearMonth,
            'month_label' => $monthLabel,
            'invoice_month' => $invoiceMonthKey,
            'invoice_month_label' => $invoiceMonthLabel,
            'installment_amount' => $computedInstallmentAmount,
            'created_at_formatted' => $createdAtFormatted,
            'bank_user' => [
                'id' => $fatura->bankUser->id ?? null,
                'bank' => [
                    'name' => optional($fatura->bankUser->card ?? null)->name ?? null,
                ],
            ],
            'category' => [
                'id' => $fatura->category->id ?? null,
                'name' => $fatura->category->name ?? null,
                'icon' => $fatura->category->icon ?? null,
                'color' => $fatura->category->color ?? null,
            ],
        ];
    }
}
