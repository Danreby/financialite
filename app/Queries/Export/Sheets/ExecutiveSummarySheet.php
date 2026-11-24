<?php

namespace App\Queries\Export\Sheets;

use App\Queries\Export\DetailedReportTotals;
use App\Queries\Export\Xlsx;
use OpenSpout\Writer\Common\Entity\Sheet;

/** Aba "Resumo Executivo": visão geral, totalizadores, médias e resumo mensal. */
final class ExecutiveSummarySheet
{
    public const NAME = 'Resumo Executivo';

    public function create(Xlsx $x): Sheet
    {
        $sheet = $x->sheet(self::NAME, [32, 20, 15, 15, 15, 15, 15], first: true);
        $x->mergeTitle($sheet, 6);

        return $sheet;
    }

    public function write(Xlsx $x, DetailedReportTotals $t): void
    {
        $money = fn (int $cents) => $cents / 100;
        $cur = [1 => $x->style('currency')];
        $pct = [1 => $x->style('percent')];
        $section = fn (string $label) => $x->add([$label], [$x->style('subHeader')]);

        $income = $t->totalIncome();
        $net = $t->netBalance();
        $months = $t->months();
        $savingsRate = $income > 0 ? $net / $income : 0;
        $expenses = $t->totalExpenses;

        $x->add(['RELATÓRIO FINANCEIRO - RESUMO EXECUTIVO'], [$x->style('title')]);
        $x->add([]);
        $x->add(['Período:', $t->periodStart && $t->periodEnd
            ? $t->periodStart->format('d/m/Y').' a '.$t->periodEnd->format('d/m/Y')
            : 'N/A']);
        $x->add(['Data de Geração:', now()->format('d/m/Y, H:i:s')]);
        $x->add([]);

        $section('VISÃO GERAL');
        $x->add(['Total de Transações', $t->count]);
        $x->add(['Total de Categorias', $t->categoriesCount()]);
        $x->add(['Total de Cartões/Contas', $t->cardsCount()]);
        $x->add(['Transações Recorrentes', $t->recurringCount]);
        $x->add(['Transações Parceladas', $t->installmentsCount]);
        $x->add([]);

        $section('TOTALIZADORES FINANCEIROS');
        $x->add(['Total de Receitas', $money($income)], $cur);
        $x->add(['Total de Despesas', $money($expenses)], $cur);
        $x->add(['Saldo Líquido', $money($net)], [1 => $x->style($net >= 0 ? 'currencyPositive' : 'currencyNegative')]);
        $x->add(['Taxa de Poupança', $savingsRate], [1 => $x->style($savingsRate >= 0 ? 'percentPositive' : 'percentNegative')]);
        $x->add([]);

        $section('CRÉDITO (Despesas no Cartão)');
        $x->add(['Total em Crédito', $money($t->totalCredit)], $cur);
        $x->add(['Crédito Pago', $money($t->paidCredit)], $cur);
        $x->add(['Crédito Pendente', $money($t->pendingCredit)], $cur);
        $x->add([]);

        $section('DÉBITO (Despesas pagas à vista)');
        $x->add(['Total em Débito', $money($t->totalDebit)], $cur);
        $x->add(['Débito Pago', $money($t->paidDebit)], $cur);
        $x->add(['Débito Pendente', $money($t->pendingDebit)], $cur);
        $x->add([]);

        $section('MÉDIAS');
        $x->add(['Receita Média Mensal', $income / max(count($months), 1) / 100], $cur);
        $x->add(['Ticket Médio de Despesa', $expenses / max($t->count, 1) / 100], $cur);
        $x->add([]);

        $section('ANÁLISE DE RECORRÊNCIA');
        $x->add(['Gastos Recorrentes', $money($t->recurringAmount)], $cur);
        $x->add(['Gastos Não Recorrentes', $money($t->nonRecurringAmount)], $cur);
        $x->add(['% Recorrentes', $expenses > 0 ? $t->recurringAmount / $expenses : 0], $pct);
        $x->add(['% Não Recorrentes', $expenses > 0 ? $t->nonRecurringAmount / $expenses : 0], $pct);
        $x->add([]);

        $section('CONTAS VENCIDAS');
        $x->add(['Quantidade Vencida', $t->overdueCount]);
        $x->add(['Valor Total Vencido', $money($t->overdueAmount)], $cur);
        $x->add([]);

        $section('RESUMO MENSAL');
        $x->header(['Mês', 'Total', 'Crédito', 'Débito', 'Pago', 'Pendente', 'Qtd Transações']);
        $c = $x->style('currency');
        foreach ($months as $month) {
            $x->add([
                $month['label'],
                $money($month['total']),
                $money($month['credit']),
                $money($month['debit']),
                $money($month['paid']),
                $money($month['pending']),
                $month['count'],
            ], [1 => $c, 2 => $c, 3 => $c, 4 => $c, 5 => $c]);
        }
    }
}
