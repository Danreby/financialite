<?php

namespace App\Queries\Export;

use App\Queries\Export\Sheets\TransactionsSheet;
use OpenSpout\Writer\AutoFilter;

/**
 * Planilha simples de transações (botão "Exportar tabela"): as mesmas colunas
 * da exportação antiga, uma linha por débito e por mês de fatura.
 */
class TransactionsExport
{
    public const FILENAME = 'transacoes_faturas';

    public const HEADERS = [
        'Mês/Ano', 'Data', 'Tipo', 'Status', 'Título', 'Descrição', 'Valor',
        'Parcelas Totais', 'Parcela Atual', 'Recorrente', 'Cartão', 'Categoria',
    ];

    public function __construct(private ExportRowsQuery $rows) {}

    public function write(Xlsx $x, int $userId, ExportFilters $filters): void
    {
        $sheet = $x->sheet('Transações', [15, 16, 10, 10, 30, 40, 15, 15, 13, 11, 22, 22], freezeHeader: true, first: true);
        $x->header(self::HEADERS);

        $currency = [6 => $x->style('currency')];
        $count = 0;

        foreach ($this->rows->rows($userId, $filters) as $row) {
            $x->add([
                $row['month_label'] ?? '',
                $row['created_at_formatted'] ?? '',
                TransactionsSheet::typeLabel($row['type'] ?? null),
                TransactionsSheet::statusLabel($row['status'] ?? null),
                $row['title'] ?? '',
                $row['description'] ?? '',
                (float) ($row['amount'] ?? 0),
                $row['total_installments'] ?? '',
                $row['current_installment'] ?? '',
                $row['is_recurring'] ? 'Sim' : 'Não',
                $row['bank_user']['bank']['name'] ?? '',
                $row['category']['name'] ?? '',
            ], $currency);
            $count++;
        }

        $sheet->setAutoFilter(new AutoFilter(0, 1, count(self::HEADERS) - 1, $count + 1));
    }
}
