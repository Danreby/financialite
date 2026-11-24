<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;

/**
 * Aba "Tendências": variação mês a mês do total de despesas. Só existe com
 * dois meses ou mais.
 */
final class TrendsSheet
{
    public const NAME = 'Tendências';

    public function applies(DetailedReportTotals $t): bool
    {
        return count($t->months()) >= 2;
    }

    public function write(Xlsx $x, DetailedReportTotals $t): void
    {
        $months = $t->months();
        $sheet = $x->sheet(self::NAME, [20, 18, 18, 18, 20]);
        $x->mergeTitle($sheet, 4);

        $trends = [];
        for ($i = 1; $i < count($months); $i++) {
            $current = $months[$i];
            $previous = $months[$i - 1];
            $trends[] = [
                'label' => $current['label'],
                'amount' => $current['total'],
                'previous' => $previous['total'],
                'variation' => $current['total'] - $previous['total'],
                'growth' => $previous['total'] > 0 ? ($current['total'] - $previous['total']) / $previous['total'] : 0,
            ];
        }

        // Primeiro mês com o maior e com o menor total.
        $highest = $months[0];
        $lowest = $months[0];
        foreach ($months as $month) {
            if ($month['total'] > $highest['total']) {
                $highest = $month;
            }
            if ($month['total'] < $lowest['total']) {
                $lowest = $month;
            }
        }

        $c = $x->style('currency');
        $p = $x->style('percent');

        $x->add(['ANÁLISE DE TENDÊNCIAS'], [$x->style('title')]);
        $x->add([]);
        $x->add(['Crescimento Médio:', array_sum(array_column($trends, 'growth')) / count($trends)], [1 => $p]);
        $x->add(['Mês Maior Gasto:', $highest['label'], $highest['total'] / 100], [2 => $c]);
        $x->add(['Mês Menor Gasto:', $lowest['label'], $lowest['total'] / 100], [2 => $c]);
        $x->add([]);
        $x->add(['EVOLUÇÃO MENSAL']);
        $x->header(['Mês', 'Valor Atual', 'Valor Anterior', 'Variação R$', 'Taxa de Crescimento']);

        foreach ($trends as $trend) {
            $x->add([
                $trend['label'],
                $trend['amount'] / 100,
                $trend['previous'] / 100,
                $trend['variation'] / 100,
                $trend['growth'],
            ], [1 => $c, 2 => $c, 3 => $c, 4 => $p]);
        }
    }
}
