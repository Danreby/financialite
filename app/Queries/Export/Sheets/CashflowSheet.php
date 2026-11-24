<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;
use OpenSpout\Writer\AutoFilter;

/**
 * Aba "Fluxo de Caixa": por mês, receita (renda recorrente + entradas avulsas
 * do mês) menos despesas (crédito + débito), com saldo acumulado.
 */
final class CashflowSheet
{
    public const NAME = 'Fluxo de Caixa';

    public function write(Xlsx $x, DetailedReportTotals $t): void
    {
        $sheet = $x->sheet(self::NAME, [18, 16, 16, 16, 18, 16, 14], freezeHeader: true);
        $x->header(['Mês', 'Receitas', 'Despesas', 'Saldo do Mês', 'Saldo Acumulado', 'Taxa de Poupança', 'Qtd Transações']);

        $c = $x->style('currency');
        $p = $x->style('percent');
        $cumulative = 0;
        $totalIncome = 0;
        $totalExpenses = 0;
        $totalCount = 0;
        $months = $t->months();

        foreach ($months as $month) {
            $income = $t->incomeForMonth($month['key']);
            $expenses = $month['credit'] + $month['debit'];
            $net = $income - $expenses;
            $cumulative += $net;
            $rate = $income > 0 ? $net / $income : ($expenses > 0 ? -1 : 0);

            $totalIncome += $income;
            $totalExpenses += $expenses;
            $totalCount += $month['count'];

            $x->add([
                $month['label'], $income / 100, $expenses / 100, $net / 100, $cumulative / 100, $rate, $month['count'],
            ], [
                1 => $c,
                2 => $c,
                3 => $x->style($net >= 0 ? 'currencyPositive' : 'currencyNegative'),
                4 => $c,
                5 => $p,
            ]);
        }

        $totalNet = $totalIncome - $totalExpenses;
        $tc = $x->style('totalCurrency');
        $x->add([
            'TOTAL',
            $totalIncome / 100,
            $totalExpenses / 100,
            $totalNet / 100,
            $totalNet / 100,
            $totalIncome > 0 ? $totalNet / $totalIncome : 0,
            $totalCount,
        ], [1 => $tc, 2 => $tc, 3 => $tc, 4 => $tc, 5 => $x->style('totalPercent')], $x->style('total'));

        $sheet->setAutoFilter(new AutoFilter(0, 1, 6, max(count($months) + 1, 1)));
    }
}
