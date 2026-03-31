<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CardUser;
use App\Models\Income;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectionsApiController extends Controller
{
    public function __construct(private FaturaBillingService $billing) {}

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $today = Carbon::now()->startOfMonth();

        // ── Current month debit (actual spending so far) ──────────────────────
        $currentMonthDebit = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
            ->whereYear('created_at', $today->year)
            ->whereMonth('created_at', $today->month)
            ->sum('amount');

        // ── Recurring incomes (for income projection) ─────────────────────────
        $recurringIncomes = Income::where('user_id', $user->id)
            ->whereIn('type', Income::RECURRING_TYPES)
            ->where('is_active', true)
            ->get(['id', 'title', 'amount', 'type']);

        $monthlyRecurringIncome = $recurringIncomes->sum('amount');

        // ── Credit transactions with future installments ───────────────────────
        $allCreditTxs = Transacao::with(['bankUser.card', 'category'])
            ->where('user_id', $user->id)
            ->where('type', 'credit')
            ->orderByDesc('created_at')
            ->get();

        $projectedTransactions = $allCreditTxs->map(function ($tx) use ($today) {
            $totalInstallments = max((int) ($tx->total_installments ?? 1), 1);
            $isRecurring       = (bool) $tx->is_recurring;
            $amountPerMonth    = (float) $tx->getInstallmentAmount();

            $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($tx);
            $firstBillingMonth    = Carbon::parse($firstBillingMonthKey . '-01');

            if (!$isRecurring) {
                $completionMonth = $firstBillingMonth->copy()->addMonths($totalInstallments - 1);
                // Skip fully paid transactions
                if ($completionMonth->lt($today)) {
                    return null;
                }
            }

            // How many installments remain from today?
            $paidInstallments = 0;
            if (!$isRecurring && $firstBillingMonth->lt($today)) {
                $paidInstallments = $today->diffInMonths($firstBillingMonth);
                $paidInstallments = min($paidInstallments, $totalInstallments);
            }
            $remainingInstallments = $isRecurring ? null : ($totalInstallments - $paidInstallments);

            return [
                'id'                    => $tx->id,
                'title'                 => $tx->title,
                'amount'                => (float) $tx->amount,
                'amount_per_month'      => $amountPerMonth,
                'is_recurring'          => $isRecurring,
                'total_installments'    => $totalInstallments,
                'remaining_installments'=> $remainingInstallments,
                'first_billing_month'   => $firstBillingMonthKey,
                'bank_name'             => $tx->bankUser?->card?->name ?? 'Cartão',
                'category_name'         => $tx->category?->name ?? 'Sem categoria',
                'category_icon'         => $tx->category?->icon,
                'category_color'        => $tx->category?->color,
            ];
        })->filter()->values();

        // ── Build 6-month projection breakdown ────────────────────────────────
        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $month    = $today->copy()->addMonths($i);
            $monthKey = $month->format('Y-m');

            $debitTotal = 0.0;
            foreach ($projectedTransactions as $tx) {
                $firstMonth = Carbon::parse($tx['first_billing_month'] . '-01');

                if ($tx['is_recurring']) {
                    if ($month->gte($firstMonth)) {
                        $debitTotal += $tx['amount_per_month'];
                    }
                } else {
                    $totalInst   = $tx['total_installments'];
                    $lastMonth   = $firstMonth->copy()->addMonths($totalInst - 1);
                    if ($month->gte($firstMonth) && $month->lte($lastMonth)) {
                        $debitTotal += $tx['amount_per_month'];
                    }
                }
            }

            $months[] = [
                'month'          => $monthKey,
                'projected_debit'=> round($debitTotal, 2),
                'projected_income' => round($monthlyRecurringIncome, 2),
            ];
        }

        return $this->success([
            'current_month_debit'     => (float) $currentMonthDebit,
            'monthly_recurring_income'=> (float) $monthlyRecurringIncome,
            'projected_months'        => $months,
            'transactions'            => $projectedTransactions,
        ]);
    }
}
