<?php

namespace App\Queries\Export;

use App\Support\Money;
use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Acumula, linha a linha, os números do relatório detalhado. Guarda só totais
 * por categoria, cartão e mês, mais as 20 maiores linhas; nunca a lista toda.
 *
 * Regras (as mesmas da exportação que rodava no navegador):
 * - valor de uma linha: crédito usa o valor da parcela (ou o total, se a parcela
 *   vier zerada); débito usa o valor total. Débito é DESPESA.
 * - receita não vem dos lançamentos: é a renda recorrente mensal mais as
 *   entradas avulsas do mês, somadas em cada mês presente no relatório.
 * - pago/pendente olham o status da parcela quando a linha vem de uma parcela, e
 *   o do lançamento nas demais (mesma regra da coluna Status da aba Transações).
 *   Tudo que não está pago conta como pendente (unpaid, pending e overdue).
 * - vencida: pendente com status overdue ou com vencimento antes de hoje
 *   (Carbon::today(), no fuso da aplicação).
 *
 * Valores em centavos.
 */
final class DetailedReportTotals
{
    public const TOP_LIMIT = 20;

    public int $count = 0;

    public int $totalExpenses = 0;

    public int $totalCredit = 0;

    public int $totalDebit = 0;

    public int $pendingDebit = 0;

    public int $pendingCredit = 0;

    public int $paidDebit = 0;

    public int $paidCredit = 0;

    public int $recurringCount = 0;

    public int $installmentsCount = 0;

    /** Só crédito, como no resumo antigo. */
    public int $recurringAmount = 0;

    public int $nonRecurringAmount = 0;

    public int $overdueCount = 0;

    public int $overdueAmount = 0;

    public ?CarbonInterface $periodStart = null;

    public ?CarbonInterface $periodEnd = null;

    /** @var array<string, true> */
    private array $categoryNames = [];

    /** @var array<string, true> */
    private array $cardNames = [];

    /** @var array<string, array{name: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}> */
    public array $byCategory = [];

    /** @var array<string, array{name: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}> */
    public array $byCard = [];

    /** @var array<string, array{key: string, label: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}> */
    public array $byMonth = [];

    /** Análise de recorrência (todas as linhas, crédito e débito). */
    public int $recurringRows = 0;

    public int $recurringTotal = 0;

    public int $nonRecurringRows = 0;

    public int $nonRecurringTotal = 0;

    /** @var list<array{value: int, seq: int, row: array<string, mixed>}> */
    private array $top = [];

    private int $seq = 0;

    private string $today;

    /**
     * @param  int  $monthlyIncome  renda recorrente ativa, em centavos
     * @param  array<string, int>  $oneTimeByMonth  entradas avulsas por 'AAAA-MM', em centavos
     */
    public function __construct(
        public readonly int $monthlyIncome = 0,
        public readonly array $oneTimeByMonth = [],
    ) {
        $this->today = Carbon::today()->toDateString();
    }

    /** Valor que a linha soma como despesa. */
    public static function value(array $row): int
    {
        $amount = Money::fromDecimal((float) ($row['amount'] ?? 0));

        if (($row['type'] ?? null) !== 'credit') {
            return $amount;
        }

        $installment = Money::fromDecimal((float) ($row['installment_amount'] ?? 0));

        return $installment !== 0 ? $installment : $amount;
    }

    /**
     * 'paid' ou 'pending'. A parcela manda quando existe; a transação usa
     * "unpaid" e a parcela "pending" para a mesma situação.
     *
     * @param  array<string, mixed>  $row
     */
    public static function paymentStatus(array $row): string
    {
        $status = $row['parcela_status'] ?? $row['status'] ?? null;

        return $status === 'paid' ? 'paid' : 'pending';
    }

    /** @param array<string, mixed> $row */
    private function isOverdue(array $row, string $status): bool
    {
        if ($status === 'paid') {
            return false;
        }

        if (($row['parcela_status'] ?? $row['status'] ?? null) === 'overdue') {
            return true;
        }

        return ! empty($row['due_date']) && $row['due_date'] < $this->today;
    }

    /** @param array<string, mixed> $row */
    public function add(array $row): void
    {
        $value = self::value($row);
        $isCredit = $row['type'] === 'credit';
        $status = self::paymentStatus($row);

        $this->count++;
        $this->totalExpenses += $value;

        if ($isCredit) {
            $this->totalCredit += $value;
            if ($row['is_recurring']) {
                $this->recurringAmount += $value;
            } else {
                $this->nonRecurringAmount += $value;
            }
            if ($status === 'paid') {
                $this->paidCredit += $value;
            } else {
                $this->pendingCredit += $value;
            }
        } else {
            $this->totalDebit += $value;
            if ($status === 'paid') {
                $this->paidDebit += $value;
            } else {
                $this->pendingDebit += $value;
            }
        }

        if ($this->isOverdue($row, $status)) {
            $this->overdueCount++;
            $this->overdueAmount += $value;
        }

        if ($row['is_recurring']) {
            $this->recurringCount++;
            $this->recurringRows++;
            $this->recurringTotal += $value;
        } else {
            $this->nonRecurringRows++;
            $this->nonRecurringTotal += $value;
        }

        if ((int) ($row['total_installments'] ?? 0) > 1) {
            $this->installmentsCount++;
        }

        $categoryName = $row['category']['name'] ?? null;
        $cardName = $row['bank_user']['bank']['name'] ?? null;
        if ($categoryName) {
            $this->categoryNames[$categoryName] = true;
        }
        if ($cardName) {
            $this->cardNames[$cardName] = true;
        }

        $createdAt = $row['created_at'] ?? null;
        if ($createdAt instanceof CarbonInterface) {
            if (! $this->periodStart || $createdAt->lt($this->periodStart)) {
                $this->periodStart = $createdAt;
            }
            if (! $this->periodEnd || $createdAt->gt($this->periodEnd)) {
                $this->periodEnd = $createdAt;
            }
        }

        $this->addToGroup($this->byCategory, $categoryName ?: 'Sem categoria', $value, $isCredit, $status);
        $this->addToGroup($this->byCard, $cardName ?: 'Sem cartão', $value, $isCredit, $status);
        $this->addToMonth($row, $value, $isCredit, $status);
        $this->addToTop($row, $value);
    }

    /**
     * @param  array<string, array{name: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}>  $groups
     */
    private function addToGroup(array &$groups, string $name, int $value, bool $isCredit, string $status): void
    {
        $groups[$name] ??= ['name' => $name, 'total' => 0, 'credit' => 0, 'debit' => 0, 'count' => 0, 'paid' => 0, 'pending' => 0];
        $groups[$name]['total'] += $value;
        $groups[$name][$isCredit ? 'credit' : 'debit'] += $value;
        $groups[$name]['count']++;
        if ($status === 'paid') {
            $groups[$name]['paid']++;
        } else {
            $groups[$name]['pending']++;
        }
    }

    /** @param array<string, mixed> $row */
    private function addToMonth(array $row, int $value, bool $isCredit, string $status): void
    {
        $key = $row['invoice_month'] ?: ($row['year_month'] ?: 'Sem data');
        $label = $row['invoice_month_label'] ?: ($row['month_label'] ?: 'Sem data');

        $this->byMonth[$key] ??= ['key' => $key, 'label' => $label, 'total' => 0, 'credit' => 0, 'debit' => 0, 'count' => 0, 'paid' => 0, 'pending' => 0];
        $this->byMonth[$key]['total'] += $value;
        $this->byMonth[$key][$isCredit ? 'credit' : 'debit'] += $value;
        $this->byMonth[$key]['count']++;
        if ($status === 'paid') {
            $this->byMonth[$key]['paid'] += $value;
        } else {
            $this->byMonth[$key]['pending'] += $value;
        }
    }

    /** @param array<string, mixed> $row */
    private function addToTop(array $row, int $value): void
    {
        $this->top[] = ['value' => $value, 'seq' => $this->seq++, 'row' => $row];

        if (count($this->top) > self::TOP_LIMIT * 10) {
            $this->trimTop();
        }
    }

    private function trimTop(): void
    {
        // Maior valor primeiro; empate fica na ordem de chegada (sort estável do JS).
        usort($this->top, fn ($a, $b) => [$b['value'], $a['seq']] <=> [$a['value'], $b['seq']]);
        $this->top = array_slice($this->top, 0, self::TOP_LIMIT);
    }

    /** @return list<array{value: int, row: array<string, mixed>}> */
    public function top(): array
    {
        $this->trimTop();

        return array_map(fn ($item) => ['value' => $item['value'], 'row' => $item['row']], $this->top);
    }

    public function categoriesCount(): int
    {
        return count($this->categoryNames);
    }

    public function cardsCount(): int
    {
        return count($this->cardNames);
    }

    /**
     * Grupos do maior total para o menor; empate mantém a ordem de chegada.
     *
     * @param  array<string, array<string, mixed>>  $groups
     * @return list<array<string, mixed>>
     */
    public static function sortedByTotal(array $groups): array
    {
        $list = array_values($groups);
        usort($list, fn ($a, $b) => $b['total'] <=> $a['total']);

        return $list;
    }

    /** @return list<array{key: string, label: string, total: int, credit: int, debit: int, count: int, paid: int, pending: int}> */
    public function months(): array
    {
        $months = $this->byMonth;
        ksort($months, SORT_STRING);

        return array_values($months);
    }

    public function incomeForMonth(string $monthKey): int
    {
        return $this->monthlyIncome + ($this->oneTimeByMonth[$monthKey] ?? 0);
    }

    public function totalIncome(): int
    {
        $sum = 0;
        foreach ($this->months() as $month) {
            $sum += $this->incomeForMonth($month['key']);
        }

        return $sum;
    }

    public function netBalance(): int
    {
        return $this->totalIncome() - $this->totalExpenses;
    }
}
