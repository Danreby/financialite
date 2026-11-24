<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\Xlsx;
use OpenSpout\Writer\AutoFilter;
use OpenSpout\Writer\Common\Entity\Sheet;

/** Aba "Transações": uma linha por débito e por mês de fatura de cada compra no cartão. */
final class TransactionsSheet
{
    public const NAME = 'Transações';

    public const HEADERS = [
        'ID', 'Data', 'Mês/Ano', 'Tipo', 'Status', 'Título', 'Descrição', 'Valor Total',
        'Valor Parcela', 'Nº Parcela', 'Total Parcelas', 'Recorrente', 'Cartão', 'Categoria',
        'Mês Fatura', 'Data Vencimento',
    ];

    public function create(Xlsx $x): Sheet
    {
        $sheet = $x->sheet(self::NAME, [8, 16, 15, 10, 11, 30, 40, 15, 15, 11, 12, 10, 22, 22, 15, 16], freezeHeader: true);
        $x->header(self::HEADERS);

        return $sheet;
    }

    /** Filtro automático sobre o cabeçalho e as $count linhas escritas. */
    public function finish(Sheet $sheet, int $count): void
    {
        $sheet->setAutoFilter(new AutoFilter(0, 1, count(self::HEADERS) - 1, $count + 1));
    }

    /** @param array<string, mixed> $row linha de ExportRowsQuery */
    public function add(Xlsx $x, array $row): void
    {
        $status = $row['parcela_status'] ?? $row['status'] ?? '';
        $amount = (float) ($row['amount'] ?? 0);
        $installment = (float) ($row['installment_amount'] ?? 0);
        $currency = $x->style('currency');

        $x->add([
            (string) ($row['id'] ?? ''),
            $row['created_at_formatted'] ?? '',
            $row['month_label'] ?? '',
            self::typeLabel($row['type'] ?? null),
            self::statusLabel($status),
            $row['title'] ?? '',
            $row['description'] ?? '',
            $amount,
            $installment ?: $amount,
            $row['display_installment'] ?: ($row['current_installment'] ?: ''),
            $row['total_installments'] ?: '',
            $row['is_recurring'] ? 'Sim' : 'Não',
            $row['bank_user']['bank']['name'] ?? '',
            $row['category']['name'] ?? '',
            ($row['invoice_month_label'] ?? null) ?: ($row['month_label'] ?? ''),
            self::dateBr($row['due_date'] ?? null),
        ], [
            4 => match ($status) {
                'paid' => $x->style('statusPaid'),
                'pending', 'unpaid' => $x->style('statusPending'),
                default => null,
            },
            7 => $currency,
            8 => $currency,
        ]);
    }

    public static function typeLabel(?string $type): string
    {
        return match ($type) {
            'credit' => 'Crédito',
            'debit' => 'Débito',
            default => (string) $type,
        };
    }

    public static function statusLabel(?string $status): string
    {
        return match ($status) {
            'paid' => 'Pago',
            'pending', 'unpaid' => 'Pendente',
            'overdue' => 'Vencido',
            default => (string) $status,
        };
    }

    private static function dateBr(?string $date): string
    {
        if (! $date) {
            return '';
        }

        $parts = explode('-', $date);

        return count($parts) === 3 ? "{$parts[2]}/{$parts[1]}/{$parts[0]}" : $date;
    }
}
