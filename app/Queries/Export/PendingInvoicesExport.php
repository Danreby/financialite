<?php

namespace App\Queries\Export;

use App\Enums\TransacaoParcelaStatus;
use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Queries\Dashboard\PaidInvoicesByMonthQuery;
use App\Services\FaturaBillingService;
use App\Support\Money;
use Carbon\Carbon;

/**
 * Faturas pendentes (botão da tela Fatura): uma linha por categoria (ou título
 * da compra sem categoria) e uma coluna por mês de fatura em aberto, com o que
 * falta pagar de cada parcela.
 *
 * Mesmas regras da tela: os meses e o "pago" de cada mês saem de
 * FaturaBillingService (billingEntries/entryStatus/entryAmount); um mês pago
 * some da planilha; parcelas pagas não entram. Lê os lançamentos em blocos e
 * guarda só os totais por mês e por linha.
 */
class PendingInvoicesExport
{
    public const FILENAME = 'faturas_pendentes';

    public function __construct(
        private FaturaBillingService $billing,
        private PaidInvoicesByMonthQuery $paidByMonth,
    ) {}

    public function write(Xlsx $x, int $userId, ?int $bankUserId, ?int $categoryId): void
    {
        // A tela Fatura sempre manda a chave bank_user_id (vazia ou não).
        $paidByMonth = $this->paidByMonth->get($userId, $bankUserId, true);
        $projectionEnd = Carbon::today()->copy()->addYear()->startOfMonth();

        /** @var array<string, array{spent: int, pending: int}> $months */
        $months = [];
        /** @var array<string, array<string, int>> $cells label => month => centavos pendentes */
        $cells = [];
        /** @var array<string, array<string, int>> $firstSeen label => month => ordem da primeira aparição */
        $firstSeen = [];
        $seq = 0;

        $transactions = Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->forUser($userId)
            ->filter(['bank_user_id' => $bankUserId, 'category_id' => $categoryId])
            ->where('type', TransacaoType::Credit)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->lazy(ExportRowsQuery::CHUNK_SIZE);

        foreach ($transactions as $transacao) {
            foreach ($this->billing->billingEntries($transacao, $projectionEnd) as $entry) {
                $monthKey = $entry['month_key'];
                $index = $entry['installment_index'];
                $amount = Money::fromDecimal($this->billing->entryAmount($transacao, $index));
                $paid = $this->billing->entryStatus($transacao, $index, $paidByMonth->get($monthKey))
                    === TransacaoParcelaStatus::Paid->value;

                $months[$monthKey] ??= ['spent' => 0, 'pending' => 0];
                $months[$monthKey]['spent'] += $amount;

                if ($paid) {
                    continue;
                }

                $months[$monthKey]['pending'] += $amount;

                $label = ($transacao->category->name ?? null) ?: ($transacao->title ?: 'Sem categoria');
                $cells[$label][$monthKey] = ($cells[$label][$monthKey] ?? 0) + $amount;
                $firstSeen[$label][$monthKey] ??= $seq;
                $seq++;
            }
        }

        $openMonths = array_keys(array_filter(
            $months,
            fn ($totals, $monthKey) => ! $this->isPaid($totals['spent'], $totals['pending'], $paidByMonth->get($monthKey)),
            ARRAY_FILTER_USE_BOTH,
        ));
        sort($openMonths, SORT_STRING);

        $x->sheet('Faturas pendentes', array_merge([30], array_fill(0, count($openMonths) + 1, 16)), freezeHeader: true, first: true);
        $x->header(array_merge(
            ['Categoria / Compra'],
            array_map(fn ($key) => ucfirst(Carbon::parse($key.'-01')->translatedFormat('F Y')), $openMonths),
            ['TOTAL'],
        ));

        $labels = $this->orderedLabels($cells, $firstSeen, $openMonths);
        $currency = $x->style('currency');
        $bold = $x->style('bold');
        $lastColumn = count($openMonths) + 1;
        $styles = array_fill(1, count($openMonths), $currency);
        $styles[0] = $bold;
        $styles[$lastColumn] = $x->style('totalCurrency');
        $monthTotals = array_fill_keys($openMonths, 0);

        foreach ($labels as $label) {
            $values = [$label];
            $rowTotal = 0;
            foreach ($openMonths as $monthKey) {
                $value = $cells[$label][$monthKey] ?? 0;
                $values[] = $value / 100;
                $rowTotal += $value;
                $monthTotals[$monthKey] += $value;
            }
            $values[] = $rowTotal / 100;
            $x->add($values, $styles);
        }

        $totalStyle = $x->style('totalCurrency');
        $x->add(
            array_merge(['TOTAL GERAL'], array_map(fn ($v) => $v / 100, array_values($monthTotals)), [array_sum($monthTotals) / 100]),
            array_fill(1, $lastColumn, $totalStyle),
            $x->style('total'),
        );

    }

    /** Mesma regra de is_paid de FaturaBillingService::groupFaturasByMonth. */
    private function isPaid(int $spentCents, int $pendingCents, ?object $payment): bool
    {
        $spent = $spentCents / 100;
        $totalPaid = $payment ? (float) ($payment->total_paid ?? 0.0) : 0.0;
        $paidAt = $payment->paid_at ?? null;

        $isPaid = ($spent > 0 && $pendingCents / 100 < 0.01)
            || ($paidAt !== null && $totalPaid > 0);

        if ($paidAt !== null && $totalPaid > 0 && $spent > $totalPaid + 0.01) {
            return false;
        }

        return $isPaid;
    }

    /**
     * Linhas na ordem em que aparecem na tela: pelo primeiro mês em aberto em que
     * o rótulo tem parcela pendente e, dentro do mês, pela ordem dos lançamentos.
     *
     * @param  array<string, array<string, int>>  $cells
     * @param  array<string, array<string, int>>  $firstSeen
     * @param  list<string>  $openMonths
     * @return list<string>
     */
    private function orderedLabels(array $cells, array $firstSeen, array $openMonths): array
    {
        $open = array_flip($openMonths);
        $keys = [];

        foreach ($cells as $label => $_) {
            $label = (string) $label;
            $candidates = array_intersect_key($firstSeen[$label], $open);
            if ($candidates === []) {
                continue;
            }
            ksort($candidates, SORT_STRING);
            $month = (string) array_key_first($candidates);
            $keys[$label] = [$month, $candidates[$month]];
        }

        uksort($keys, fn ($a, $b) => $keys[$a] <=> $keys[$b]);

        return array_map('strval', array_keys($keys));
    }
}
