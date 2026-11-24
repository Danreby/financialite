<?php

namespace App\Queries\Export;

use App\Models\Income;
use App\Queries\Export\Sheets\CashflowSheet;
use App\Queries\Export\Sheets\ExecutiveSummarySheet;
use App\Queries\Export\Sheets\GroupAnalysisSheet;
use App\Queries\Export\Sheets\RecurringSheet;
use App\Queries\Export\Sheets\TopTransactionsSheet;
use App\Queries\Export\Sheets\TransactionsSheet;
use App\Queries\Export\Sheets\TrendsSheet;
use App\Services\IncomeService;
use App\Support\Money;

/**
 * Relatório detalhado (botão da tela Relatórios), gerado em uma passada:
 * as linhas vão direto para a aba Transações enquanto DetailedReportTotals
 * acumula os números; as abas de análise vêm depois e o Resumo Executivo,
 * que é a primeira aba, é preenchido por último.
 */
class DetailedReportExport
{
    public const FILENAME = 'relatorio_financeiro_detalhado';

    public function __construct(
        private ExportRowsQuery $rows,
        private IncomeService $incomes,
        private ExecutiveSummarySheet $summary,
        private TransactionsSheet $transactions,
        private GroupAnalysisSheet $groups,
        private TopTransactionsSheet $top,
        private RecurringSheet $recurring,
        private TrendsSheet $trends,
        private CashflowSheet $cashflow,
    ) {}

    public function write(Xlsx $x, int $userId, ExportFilters $filters): void
    {
        $totals = new DetailedReportTotals(
            Money::fromDecimal($this->incomes->totalMonthlyIncome($userId)),
            $this->oneTimeIncomeByMonth($userId),
        );

        $summarySheet = $this->summary->create($x);
        $transactionsSheet = $this->transactions->create($x);

        foreach ($this->rows->rows($userId, $filters) as $row) {
            $this->transactions->add($x, $row);
            $totals->add($row);
        }
        $this->transactions->finish($transactionsSheet, $totals->count);

        $this->groups->write($x, GroupAnalysisSheet::CATEGORY, 'Categoria', $totals->byCategory, $totals->totalExpenses);
        $this->groups->write($x, GroupAnalysisSheet::CARD, 'Cartão', $totals->byCard, $totals->totalExpenses);
        $this->top->write($x, $totals);
        $this->recurring->write($x, $totals);
        if ($this->trends->applies($totals)) {
            $this->trends->write($x, $totals);
        }
        $this->cashflow->write($x, $totals);

        $x->writer->setCurrentSheet($summarySheet);
        $this->summary->write($x, $totals);
    }

    /**
     * Entradas avulsas ativas por mês de recebimento, em centavos (as mesmas
     * que a tela Relatórios recebe em one_time_incomes).
     *
     * @return array<string, int>
     */
    private function oneTimeIncomeByMonth(int $userId): array
    {
        $byMonth = [];

        Income::forUser($userId)
            ->where('is_recurring', false)
            ->where('is_active', true)
            ->whereNotNull('received_at')
            ->select(['id', 'amount', 'received_at'])
            ->lazyById(500)
            ->each(function (Income $income) use (&$byMonth) {
                $key = $income->received_at->format('Y-m');
                $byMonth[$key] = ($byMonth[$key] ?? 0) + Money::fromDecimal((string) $income->amount);
            });

        return $byMonth;
    }
}
