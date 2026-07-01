<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bill\BillStoreRequest;
use App\Http\Requests\Bill\BillUpdateRequest;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Services\BillPaymentService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private BillPaymentService $billPaymentService
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bill::class);

        $user = $request->user();

        $bills = $this->buildBillList($user->id);

        return $this->success($bills);
    }

    public function store(BillStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Bill::class);

        $user = $request->user();
        $data = $request->validated();

        $bill = DB::transaction(function () use ($data, $user) {
            $bill = Bill::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'recurrence_type' => $data['recurrence_type'],
                'due_day' => $data['due_day'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'color' => $data['color'] ?? '#3b82f6',
                'icon' => $data['icon'] ?? 'FileText',
                'status' => $data['status'] ?? 'active',
                'category_id' => $data['category_id'] ?? null,
                'user_id' => $user->id,
            ]);

            $this->notifications->success($user, 'Conta cadastrada', 'Nova conta a pagar foi adicionada com sucesso.');

            return $bill->load('category:id,name,color,icon');
        });

        return $this->success($bill, 201);
    }

    public function update(BillUpdateRequest $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($bill, $data, $user) {
            $bill->update($data);

            $this->notifications->info($user, 'Conta atualizada', 'A conta foi atualizada com sucesso.');
        });

        return $this->success($bill->load('category:id,name,color,icon'));
    }

    public function destroy(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('delete', $bill);

        $user = $request->user();

        DB::transaction(function () use ($bill, $user) {
            $bill->delete();

            $this->notifications->info($user, 'Conta removida', 'A conta foi removida com sucesso.');
        });

        return $this->success(['message' => 'Conta removida com sucesso.']);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bill::class);

        $user = $request->user();
        $days = $request->input('days', 30);

        $activeBills = Bill::forUser($user->id)
            ->active()
            ->with(['category:id,name,color,icon', 'payments'])
            ->get();

        $upcomingBills = [];
        $today = Carbon::today();
        $endDate = $today->copy()->addDays($days);

        foreach ($activeBills as $bill) {
            $nextDueDate = $bill->getNextDueDate();

            if ($nextDueDate && $nextDueDate->lte($endDate)) {
                // Check if there's already a payment for this due date
                $payment = BillPayment::where('bill_id', $bill->id)
                    ->whereDate('due_date', $nextDueDate->format('Y-m-d'))
                    ->first();

                $status = $payment ? $payment->status : 'pending';
                $daysUntil = $today->diffInDays($nextDueDate, false);

                // Update status to overdue if it's past due
                if (! $payment && $nextDueDate->lt($today)) {
                    $status = 'overdue';
                }

                $upcomingBills[] = [
                    'id' => $bill->id,
                    'title' => $bill->title,
                    'description' => $bill->description,
                    'amount' => (float) $bill->amount,
                    'due_date' => $nextDueDate->format('Y-m-d'),
                    'days_until' => (int) $daysUntil,
                    'status' => $status,
                    'color' => $bill->color,
                    'icon' => $bill->icon,
                    'category' => $bill->category,
                    'recurrence_type' => $bill->recurrence_type,
                    'payment_id' => $payment?->id,
                ];
            }
        }

        // Sort by due date
        usort($upcomingBills, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));

        return $this->success($upcomingBills);
    }

    public function markAsPaid(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $validated = $request->validate([
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $payment = $this->billPaymentService->markBillAsPaid(
            $bill,
            $user,
            $validated
        );

        return $this->success($payment);
    }

    public function updatePayment(Request $request, Bill $bill, BillPayment $payment): JsonResponse
    {
        $this->authorize('update', $bill);

        if ($payment->bill_id !== $bill->id) {
            abort(404);
        }

        $validated = $request->validate([
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'amount_due' => ['nullable', 'numeric', 'min:0'],
            'paid_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment->update([
            'amount_paid' => $validated['amount_paid'],
            'amount_due' => $validated['amount_due'] ?? $payment->amount_due,
            'paid_date' => $validated['paid_date'] ?? $payment->paid_date,
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->success($payment->fresh());
    }

    public function destroyPayment(Request $request, Bill $bill, BillPayment $payment): JsonResponse
    {
        $this->authorize('update', $bill);

        if ($payment->bill_id !== $bill->id) {
            abort(404);
        }

        $payment->delete();

        return $this->success(['message' => 'Pagamento removido do histórico.']);
    }

    public function toggleStatus(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $user = $request->user();

        $bill = $this->billPaymentService->toggleBillStatus($bill, $user);

        return $this->success($bill);
    }

    public function page(Request $request): InertiaResponse
    {
        $user = $request->user();

        $bills = $this->buildBillList($user->id);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Contas', [
            'bills' => $bills,
            'categories' => $categories,
        ]);
    }

    private function buildBillList(int $userId): \Illuminate\Support\Collection
    {
        return Bill::forUser($userId)
            ->with([
                'category:id,name,color,icon',
                'payments' => fn ($q) => $q->latest('due_date'),
            ])
            ->orderBy('due_day')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($bill) => $this->enrichBillWithPaymentInfo($bill))
            ->values();
    }

    private function enrichBillWithPaymentInfo(Bill $bill): array
    {
        $data = $bill->toArray();
        unset($data['payments']);

        $paidPayments = $bill->relationLoaded('payments')
            ? $bill->payments->where('status', 'paid')->sortByDesc('due_date')
            : collect();

        $currentYear = Carbon::now()->year;
        $totalPaidThisYear = $paidPayments
            ->filter(fn ($p) => Carbon::parse($p->due_date)->year === $currentYear)
            ->sum(fn ($p) => (float) $p->amount_paid);

        $avgPaid = $paidPayments->count() > 0
            ? round($paidPayments->avg(fn ($p) => (float) $p->amount_paid), 2)
            : 0;

        $lastPayment = $paidPayments->first();

        $data['payment_stats'] = [
            'payments_count' => $paidPayments->count(),
            'total_paid_this_year' => round($totalPaidThisYear, 2),
            'avg_paid' => $avgPaid,
            'last_payment_date' => $lastPayment?->due_date?->format('Y-m-d'),
            'last_payment_amount' => $lastPayment ? (float) $lastPayment->amount_paid : null,
        ];

        $data['payment_history'] = $paidPayments->take(24)->values()->map(fn ($p) => [
            'id' => $p->id,
            'due_date' => $p->due_date->format('Y-m-d'),
            'paid_date' => $p->paid_date?->format('Y-m-d'),
            'amount_due' => (float) $p->amount_due,
            'amount_paid' => (float) $p->amount_paid,
            'status' => $p->status,
            'notes' => $p->notes,
        ])->all();

        if ($bill->status !== 'active' || ! $bill->due_day) {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = null;

            return $data;
        }

        $today = Carbon::today();
        $currentPeriodDue = $this->getCurrentPeriodDueDate($bill, $today);

        if (! $currentPeriodDue) {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = null;

            return $data;
        }

        $isPaid = $bill->relationLoaded('payments') && $bill->payments->contains(
            fn ($p) => $p->status === 'paid' && Carbon::parse($p->due_date)->isSameDay($currentPeriodDue)
        );

        if ($isPaid) {
            $nextDue = $this->getNextPeriodDueDate($bill, $currentPeriodDue);
            $data['is_paid_this_period'] = true;
            $data['next_due_date'] = $nextDue?->format('Y-m-d');
        } else {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = $currentPeriodDue->format('Y-m-d');
        }

        return $data;
    }

    private function getCurrentPeriodDueDate(Bill $bill, Carbon $today): ?Carbon
    {
        switch ($bill->recurrence_type) {
            case 'monthly':
                return $today->copy()->day(min($bill->due_day, $today->daysInMonth));

            case 'yearly':
                $startDate = $bill->start_date;
                if (! $startDate) {
                    return null;
                }
                $monthDays = $today->copy()->month($startDate->month)->daysInMonth;
                $candidate = $today->copy()->month($startDate->month)->day(min($bill->due_day, $monthDays));
                if ($candidate->gt($today->copy()->addMonths(6))) {
                    $candidate->subYear();
                }

                return $candidate;

            case 'none':
                return $bill->start_date ? Carbon::parse($bill->start_date) : null;

            default:
                return null;
        }
    }

    private function getNextPeriodDueDate(Bill $bill, Carbon $currentDue): ?Carbon
    {
        switch ($bill->recurrence_type) {
            case 'monthly':
                $next = $currentDue->copy()->addMonth();

                return $next->day(min($bill->due_day, $next->daysInMonth));

            case 'yearly':
                $next = $currentDue->copy()->addYear();

                return $next->day(min($bill->due_day, $next->daysInMonth));

            default:
                return null;
        }
    }
}
