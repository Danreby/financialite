<?php

namespace App\Services;

use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FaturaExportService
{
    public function __construct(private FaturaBillingService $billing)
    {
    }

    public function exportForUser(int $userId, ?int $bankUserId = null, ?int $categoryId = null): Collection
    {
        $transactions = Transacao::with(['bankUser.card', 'category'])
            ->forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->orderBy('created_at', 'desc')
            ->get();

        $today       = Carbon::today();
        $currentMonth = $today->format('Y-m');

        $rows = collect();

        foreach ($transactions as $transacao) {
            if ($transacao->type === 'debit') {
                $rows->push($this->buildRow($transacao, null, null));
                continue;
            }

            $firstMonthKey    = $this->billing->resolveBillingMonthKey($transacao);
            $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
            $installmentAmount = (float) $transacao->amount / $totalInstallments;
            $isRecurring       = (bool) $transacao->is_recurring;

            $cursor = Carbon::createFromFormat('Y-m', $firstMonthKey)->startOfMonth();

            if ($isRecurring) {
                while ($cursor->format('Y-m') <= $currentMonth) {
                    $rows->push($this->buildRow($transacao, $cursor->format('Y-m'), null, $installmentAmount));
                    $cursor->addMonthNoOverflow();
                }
            } else {
                for ($i = 1; $i <= $totalInstallments; $i++) {
                    $rows->push($this->buildRow($transacao, $cursor->format('Y-m'), $i, $installmentAmount));
                    $cursor->addMonthNoOverflow();
                }
            }
        }

        return $rows;
    }
    
    private function buildRow(
        Transacao $fatura,
        ?string   $overrideInvoiceMonth = null,
        ?int      $displayInstallment   = null,
        ?float    $installmentAmount    = null,
    ): array {
        $createdAt          = $fatura->created_at;
        $yearMonth          = $createdAt ? $createdAt->format('Y-m') : null;
        $monthLabel         = $createdAt ? ucfirst($createdAt->translatedFormat('F Y')) : null;
        $createdAtFormatted = $createdAt ? $createdAt->format('d/m/Y H:i') : null;

        if ($fatura->type === 'credit') {
            $invoiceMonthKey = $overrideInvoiceMonth ?? $this->billing->resolveBillingMonthKey($fatura);
            $invoiceCarbon   = Carbon::createFromFormat('Y-m', $invoiceMonthKey)->startOfMonth();
            $invoiceMonthLabel = ucfirst($invoiceCarbon->translatedFormat('F Y'));

            $computedInstallmentAmount = $installmentAmount
                ?? ((float) $fatura->getInstallmentAmount());
        } else {
            $invoiceMonthKey   = $yearMonth;
            $invoiceMonthLabel = $monthLabel;
            $computedInstallmentAmount = (float) $fatura->amount;
        }

        return [
            'id'                  => (string) $fatura->id,
            'title'               => $fatura->title,
            'description'         => $fatura->description,
            'amount'              => (float) $fatura->amount,
            'type'                => $fatura->type,
            'status'              => $fatura->status,
            'created_at'          => $fatura->created_at,
            'total_installments'  => $fatura->total_installments,
            'current_installment' => $fatura->current_installment,
            'display_installment' => $displayInstallment,
            'is_recurring'        => (bool) $fatura->is_recurring,
            'year_month'          => $yearMonth,
            'month_label'         => $monthLabel,
            'invoice_month'       => $invoiceMonthKey,
            'invoice_month_label' => $invoiceMonthLabel,
            'installment_amount'  => $computedInstallmentAmount,
            'created_at_formatted' => $createdAtFormatted,
            'bank_user' => [
                'id'   => $fatura->bankUser->id ?? null,
                'bank' => [
                    'name' => optional($fatura->bankUser->card ?? null)->name ?? null,
                ],
            ],
            'category' => [
                'id'    => $fatura->category->id ?? null,
                'name'  => $fatura->category->name ?? null,
                'icon'  => $fatura->category->icon ?? null,
                'color' => $fatura->category->color ?? null,
            ],
        ];
    }
}
