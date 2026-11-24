<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;
use OpenSpout\Writer\AutoFilter;

/**
 * Abas "Análise por Categoria" e "Análise por Cartão": total, crédito, débito,
 * quantidades e participação de cada grupo no total de despesas.
 */
final class GroupAnalysisSheet
{
    public const CATEGORY = 'Análise por Categoria';

    public const CARD = 'Análise por Cartão';

    /**
     * @param  array<string, array{name: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}>  $groups
     */
    public function write(Xlsx $x, string $name, string $firstColumn, array $groups, int $totalExpenses): void
    {
        $sheet = $x->sheet($name, [25, 15, 15, 15, 10, 10, 10, 12, 15], freezeHeader: true);
        $x->header([$firstColumn, 'Total', 'Crédito', 'Débito', 'Qtd', 'Pago', 'Pendente', '% do Total', 'Ticket Médio']);

        $c = $x->style('currency');
        $p = $x->style('percent');
        $sum = ['credit' => 0, 'debit' => 0, 'count' => 0, 'paid' => 0, 'pending' => 0];

        $sorted = DetailedReportTotals::sortedByTotal($groups);
        foreach ($sorted as $group) {
            $x->add([
                $group['name'],
                $group['total'] / 100,
                $group['credit'] / 100,
                $group['debit'] / 100,
                $group['count'],
                $group['paid'],
                $group['pending'],
                $totalExpenses > 0 ? $group['total'] / $totalExpenses : 0,
                $group['count'] > 0 ? $group['total'] / $group['count'] / 100 : 0,
            ], [1 => $c, 2 => $c, 3 => $c, 7 => $p, 8 => $c]);

            foreach ($sum as $key => $_) {
                $sum[$key] += $group[$key];
            }
        }

        $tc = $x->style('totalCurrency');
        $x->add([
            'TOTAL',
            $totalExpenses / 100,
            $sum['credit'] / 100,
            $sum['debit'] / 100,
            $sum['count'],
            $sum['paid'],
            $sum['pending'],
            1,
            $sum['count'] > 0 ? $totalExpenses / $sum['count'] / 100 : 0,
        ], [1 => $tc, 2 => $tc, 3 => $tc, 7 => $x->style('totalPercent'), 8 => $tc], $x->style('total'));

        $sheet->setAutoFilter(new AutoFilter(0, 1, 8, max(count($sorted) + 1, 1)));
    }
}
