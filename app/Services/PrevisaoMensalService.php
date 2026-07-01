<?php

namespace App\Services;

use App\Contracts\Services\PrevisaoMensalServiceInterface;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Fatura;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

class PrevisaoMensalService implements PrevisaoMensalServiceInterface
{
    public function __construct(private FaturaBillingService $billing) {}

    public function buildPrevisaoMensal(Authenticatable $user, array $filters = []): array
    {
        $userId = $user->id;
        $monthKey = $filters['month_key'] ?? Carbon::today()->format('Y-m');

        $targetMonth = Carbon::parse($monthKey.'-01');
        $targetMonthEnd = $targetMonth->copy()->endOfMonth();

        return [
            'month_key' => $monthKey,
            'month_label' => ucfirst($targetMonth->locale('pt_BR')->translatedFormat('F \\d\\e Y')),
            'invoice' => [
                'projected' => $this->buildProjectedInvoice($userId, $targetMonth),
                'pending' => $this->buildPendingInvoice($user),
            ],
            'bills' => $this->buildBillsForecast($userId, $targetMonth),
            'debit_category_averages' => $this->buildDebitCategoryAverages($userId, $targetMonth, $targetMonthEnd),
        ];
    }

    private function buildProjectedInvoice(int $userId, Carbon $targetMonth): array
    {
        $monthKey = $targetMonth->format('Y-m');

        $creditTransactions = Transacao::with(['bankUser.card', 'parcelas'])
            ->forUser($userId)
            ->where('type', 'credit')
            ->whereNotNull('bank_user_id')
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $targetMonth));

        $cards = $creditTransactions->groupBy('bank_user_id')
            ->map(function ($items) use ($monthKey) {
                $first = $items->first();
                $cardName = optional($first->bankUser?->card)->name ?? 'Cartão desconhecido';

                $total = $items->sum(function (Transacao $t) use ($monthKey) {
                    if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
                        $parcela = $t->parcelas->firstWhere('month_key', $monthKey);

                        return $parcela
                            ? (float) $t->getInstallmentAmount($parcela->installment_number)
                            : (float) $t->getInstallmentAmount();
                    }

                    $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $monthKey);

                    return (float) $t->getInstallmentAmount($installmentNumber);
                });

                return [
                    'bank_user_id' => $first->bank_user_id,
                    'card_name' => $cardName,
                    'total' => round($total, 2),
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->toArray();

        return [
            'total' => round(collect($cards)->sum('total'), 2),
            'cards' => $cards,
        ];
    }

    private function buildPendingInvoice(Authenticatable $user): array
    {
        $creditTransactions = Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->forUser($user->id)
            ->where('type', 'credit')
            ->notStatus('paid')
            ->get();

        if ($creditTransactions->isEmpty()) {
            return [
                'total' => 0.0,
                'month_key' => null,
                'month_label' => null,
                'has_pending' => false,
            ];
        }

        $paidByMonth = Fatura::where('user_id', $user->id)->get()->keyBy('month_key');
        $monthlyGroups = $this->billing->groupFaturasByMonth($creditTransactions, $paidByMonth);
        $currentMonthKey = $this->billing->resolveCurrentBillingMonthKey(null);
        $effective = $this->billing->resolveEffectiveGroup($monthlyGroups, $currentMonthKey);

        $total = $this->billing->calculatePendingBillFromGroup($effective['group']);
        $effectiveMonthKey = $effective['month_key'];
        $monthLabel = $effectiveMonthKey
            ? ucfirst(Carbon::parse($effectiveMonthKey.'-01')->locale('pt_BR')->translatedFormat('F \\d\\e Y'))
            : null;

        return [
            'total' => round($total, 2),
            'month_key' => $effectiveMonthKey,
            'month_label' => $monthLabel,
            'has_pending' => $total > 0,
        ];
    }

    private function buildBillsForecast(int $userId, Carbon $targetMonth): array
    {
        $bills = Bill::forUser($userId)
            ->active()
            ->with('category:id,name,color,icon')
            ->get()
            ->filter(fn (Bill $bill) => $bill->getDueDateForMonth($targetMonth) !== null);

        $items = $bills->map(function (Bill $bill) {
            $isEstimated = $bill->amount === null;

            if ($isEstimated) {
                $average = BillPayment::where('bill_id', $bill->id)
                    ->where('status', 'paid')
                    ->avg('amount_paid');
                $amount = round((float) ($average ?? 0), 2);
            } else {
                $amount = round((float) $bill->amount, 2);
            }

            return [
                'id' => $bill->id,
                'title' => $bill->title,
                'amount' => $amount,
                'is_estimated' => $isEstimated,
                'category_name' => optional($bill->category)->name,
                'category_icon' => optional($bill->category)->icon,
                'category_color' => optional($bill->category)->color,
            ];
        })->sortByDesc('amount')->values()->toArray();

        return [
            'total' => round(collect($items)->sum('amount'), 2),
            'items' => $items,
        ];
    }

    private function buildDebitCategoryAverages(int $userId, Carbon $targetMonth, Carbon $targetMonthEnd): array
    {
        $monthCount = 4;
        $lookbackStart = $targetMonth->copy()->subMonths($monthCount - 1)->startOfMonth();

        $debitTransactions = Transacao::with('category')
            ->forUser($userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$lookbackStart, $targetMonthEnd])
            ->get();

        $categories = $debitTransactions
            ->groupBy('category_id')
            ->map(function ($items) use ($monthCount) {
                $first = $items->first();
                $average = round($items->sum('amount') / $monthCount, 2);

                return [
                    'category_id' => $first->category_id,
                    'category_name' => optional($first->category)->name ?? 'Sem categoria',
                    'category_icon' => optional($first->category)->icon,
                    'category_color' => optional($first->category)->color,
                    'average' => $average,
                ];
            })
            ->sortByDesc('average')
            ->values()
            ->toArray();

        return [
            'total' => round(collect($categories)->sum('average'), 2),
            'categories' => $categories,
        ];
    }
}
