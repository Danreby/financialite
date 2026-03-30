<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Models\CardUser;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();

        $perPage = 15;

        $filters = [
            'type' => $request->get('type'),
            'bank_user_id' => $request->get('bank_user_id'),
            'category_id' => $request->get('category_id'),
            'status' => $request->get('status'),
        ];

        $order = $request->get('order', 'created_desc');

        $monthKey = $request->get('month_key');
        $monthRange = null;
        if ($monthKey) {
            try {
                $monthDate = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
                $monthRange = [
                    $monthDate->copy()->startOfMonth(),
                    $monthDate->copy()->endOfMonth(),
                ];
            } catch (\Throwable $e) {
                $monthRange = null;
            }
        }

        $recurringParam = $request->get('recurring');
        if ($recurringParam === 'recurring') {
            $filters['is_recurring'] = true;
        } elseif ($recurringParam === 'non_recurring') {
            $filters['is_recurring'] = false;
        }

        $search = trim((string) $request->get('search', ''));
        $search = e($search);

        $transactions = Transacao::with(['bankUser.card', 'category'])
            ->withCount('anexos')
            ->forUser($user->id)
            ->filter($filters)
            ->when($monthRange, function ($q) use ($monthRange) {
                [$start, $end] = $monthRange;
                $q->whereBetween('created_at', [$start, $end]);
            })
            ->when($search !== '', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            })
            ->when(true, function ($q) use ($order) {
                $validOrders = [
                    'created_asc' => ['created_at', 'asc'],
                    'created_desc' => ['created_at', 'desc'],
                    'title_asc' => ['title', 'asc'],
                    'title_desc' => ['title', 'desc'],
                    'amount_asc' => ['amount', 'asc'],
                    'amount_desc' => ['amount', 'desc'],
                ];
                
                $orderConfig = $validOrders[$order] ?? $validOrders['created_desc'];
                $q->orderBy($orderConfig[0], $orderConfig[1]);
            })
            ->paginate($perPage, ['*'], 'transactions_page')
            ->withQueryString()
            ->through(function (Transacao $transacao) {
                return [
                    'id' => $transacao->id,
                    'title' => $transacao->title,
                    'description' => $transacao->description,
                    'amount' => (float) $transacao->amount,
                    'type' => $transacao->type,
                    'status' => $transacao->status,
                    'paid_date' => $transacao->paid_date,
                    'created_at' => $transacao->created_at,
                    'total_installments' => $transacao->total_installments,
                    'current_installment' => $transacao->current_installment,
                    'is_recurring' => (bool) $transacao->is_recurring,
                    'bank_user_id' => $transacao->bank_user_id,
                    'bank_name' => optional($transacao->bankUser->card ?? null)->name ?? null,
                    'category_id' => $transacao->category_id,
                    'category_name' => $transacao->category->name ?? null,
                    'category_icon' => $transacao->category->icon ?? null,
                    'category_color' => $transacao->category->color ?? null,
                    'anexos_count' => $transacao->anexos_count ?? 0,
                ];
            });

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(function ($cardUser) {
                return [
                    'id' => $cardUser->id,
                    'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();

        $categories = Category::forUser($user->id)
            ->ordered()
            ->get(['id', 'name', 'icon', 'color']);

        $months = Transacao::where('user_id', $user->id)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key")
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderByRaw("DATE_FORMAT(created_at, '%Y-%m') DESC")
            ->pluck('month_key')
            ->filter()
            ->unique()
            ->values()
            ->map(function (string $key) {
                try {
                    $label = Carbon::createFromFormat('Y-m', $key)->translatedFormat('F Y');
                } catch (\Throwable $e) {
                    $label = $key;
                }

                return [
                    'month_key' => $key,
                    'month_label' => ucfirst($label),
                    'is_paid' => false,
                ];
            });

        return Inertia::render('Transacao', [
            'transactions' => $transactions,
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
            'months' => $months,
            'filters' => [
                'type' => $filters['type'] ?? null,
                'bank_user_id' => $filters['bank_user_id'] ?? null,
                'category_id' => $filters['category_id'] ?? null,
                'status' => $filters['status'] ?? null,
                'recurring' => $recurringParam,
                'search' => $search,
                'month_key' => $monthKey,
                'order' => $order,
            ],
        ]);
    }
}
