<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bill\BillStoreRequest;
use App\Http\Requests\Bill\BillUpdateRequest;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Services\NotificationService;
use App\Services\BillPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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

        $bills = Bill::forUser($user->id)
            ->with(['category:id,name,color,icon'])
            ->orderBy('due_day')
            ->orderBy('created_at', 'desc')
            ->get();

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
                if (!$payment && $nextDueDate->lt($today)) {
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
        usort($upcomingBills, fn($a, $b) => strcmp($a['due_date'], $b['due_date']));

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

    public function toggleStatus(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $user = $request->user();

        $bill = $this->billPaymentService->toggleBillStatus($bill, $user);

        return $this->success($bill);
    }
}
