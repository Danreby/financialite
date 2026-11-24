<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;

/** Aba "Recorrentes vs Não Recorr.": quantidade, total e ticket médio de cada grupo. */
final class RecurringSheet
{
    public const NAME = 'Recorrentes vs Não Recorr.';

    public function write(Xlsx $x, DetailedReportTotals $t): void
    {
        $sheet = $x->sheet(self::NAME, [30, 20, 20]);
        $x->mergeTitle($sheet, 2);

        $recAvg = $t->recurringRows > 0 ? $t->recurringTotal / $t->recurringRows : 0;
        $nonAvg = $t->nonRecurringRows > 0 ? $t->nonRecurringTotal / $t->nonRecurringRows : 0;
        $sum = $t->recurringTotal + $t->nonRecurringTotal;
        $recPct = $sum > 0 ? $t->recurringTotal / $sum : 0;

        $c = $x->style('currency');
        $p = [1 => $x->style('percent')];
        $sub = [$x->style('subHeader')];

        $x->add(['ANÁLISE DE GASTOS RECORRENTES VS NÃO RECORRENTES'], [$x->style('title')]);
        $x->add([]);
        $x->add(['GASTOS RECORRENTES'], $sub);
        $x->add(['Quantidade de Transações', $t->recurringRows]);
        $x->add(['Valor Total', $t->recurringTotal / 100], [1 => $c]);
        $x->add(['Ticket Médio', $recAvg / 100], [1 => $c]);
        $x->add(['Percentual do Total', $recPct], $p);
        $x->add([]);
        $x->add(['GASTOS NÃO RECORRENTES'], $sub);
        $x->add(['Quantidade de Transações', $t->nonRecurringRows]);
        $x->add(['Valor Total', $t->nonRecurringTotal / 100], [1 => $c]);
        $x->add(['Ticket Médio', $nonAvg / 100], [1 => $c]);
        $x->add(['Percentual do Total', 1 - $recPct], $p);
        $x->add([]);
        $x->add(['COMPARATIVO'], $sub);
        $x->header(['Métrica', 'Recorrentes', 'Não Recorrentes']);
        $x->add(['Quantidade', $t->recurringRows, $t->nonRecurringRows]);
        $x->add(['Valor Total', $t->recurringTotal / 100, $t->nonRecurringTotal / 100], [1 => $c, 2 => $c]);
        $x->add(['Ticket Médio', $recAvg / 100, $nonAvg / 100], [1 => $c, 2 => $c]);
    }
}
