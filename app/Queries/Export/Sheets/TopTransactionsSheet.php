<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;

/** Aba "Top 20 Transações": as linhas de maior valor. */
final class TopTransactionsSheet
{
    public const NAME = 'Top 20 Transações';

    public function write(Xlsx $x, DetailedReportTotals $t): void
    {
        $x->sheet(self::NAME, [8, 30, 20, 20, 15, 16, 10, 10, 10], freezeHeader: true);
        $x->header(['Ranking', 'Título', 'Categoria', 'Banco', 'Valor', 'Data', 'Status', 'Tipo', 'Recorrente']);

        foreach ($t->top() as $index => $item) {
            $row = $item['row'];
            $x->add([
                $index + 1,
                $row['title'] ?? '',
                ($row['category']['name'] ?? null) ?: 'Sem categoria',
                ($row['bank_user']['bank']['name'] ?? null) ?: 'Sem cartão',
                $item['value'] / 100,
                $row['created_at_formatted'] ?? '',
                TransactionsSheet::statusLabel($row['status'] ?? null),
                TransactionsSheet::typeLabel($row['type'] ?? null),
                $row['is_recurring'] ? 'Sim' : 'Não',
            ], [4 => $x->style('currency')]);
        }
    }
}
