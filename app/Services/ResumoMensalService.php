<?php

namespace App\Services;

use App\Contracts\Services\ResumoMensalServiceInterface;
use App\Queries\ResumoMensal\CategoryAveragesQuery;
use App\Queries\ResumoMensal\ExpenseCalendarQuery;
use App\Queries\ResumoMensal\ExpensesByBankQuery;
use App\Queries\ResumoMensal\ExpensesByCardQuery;
use App\Queries\ResumoMensal\ExpensesByCategoryQuery;
use App\Queries\ResumoMensal\MonthIncomesQuery;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Fachada do Resumo mensal (GET /resumo-mensal/data). Cada bloco da tela vem
 * de uma Query em app/Queries/ResumoMensal; aqui só se monta a resposta.
 */
class ResumoMensalService implements ResumoMensalServiceInterface
{
    public function __construct(
        private MonthIncomesQuery $incomes,
        private ExpensesByCategoryQuery $expensesByCategory,
        private CategoryAveragesQuery $categoryAverages,
        private ExpenseCalendarQuery $calendar,
        private ExpensesByCardQuery $expensesByCard,
        private ExpensesByBankQuery $expensesByBank,
    ) {}

    public function buildResumoMensal(Authenticatable $user, array $filters = []): array
    {
        $userId = $user->id;
        $monthKey = $filters['month_key'] ?? Carbon::today()->format('Y-m');
        $month = Carbon::parse($monthKey.'-01');

        $incomes = $this->incomes->get($userId, $month);
        $expensesByCategory = $this->expensesByCategory->get($userId, $month);

        $totalIncome = collect($incomes)->sum('amount');
        $totalExpenses = collect($expensesByCategory)->sum('total');

        return [
            'month_key' => $monthKey,
            'month_label' => ucfirst($month->locale('pt_BR')->translatedFormat('F \\d\\e Y')),
            'summary' => [
                'total_income' => round($totalIncome, 2),
                'total_expenses' => round($totalExpenses, 2),
                'balance' => round($totalIncome - $totalExpenses, 2),
            ],
            'incomes' => $incomes,
            'expenses_by_category' => $expensesByCategory,
            'category_averages' => $this->categoryAverages->get($userId, $month),
            'calendar' => $this->calendar->get($userId, $month),
            'expenses_by_card' => $this->expensesByCard->get($userId, $month),
            'expenses_by_bank' => $this->expensesByBank->get($userId, $month),
        ];
    }
}
