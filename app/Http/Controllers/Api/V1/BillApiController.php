<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bill\BillStoreRequest;
use App\Http\Requests\Bill\BillUpdateRequest;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Services\BillPaymentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillApiController extends Controller
{
    public function __construct(
        private BillPaymentService $billPaymentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $bills = Bill::where('user_id', $user->id)
            ->with('category')
            ->orderBy('due_day')
            ->get()
            ->map(function (Bill $bill) {
                $lastPayment = BillPayment::where('bill_id', $bill->id)
                    ->orderByDesc('due_date')
                    ->first();

                return [
                    ...$bill->toArray(),
                    'last_payment' => $lastPayment,
                ];
            });

        return $this->success($bills);
    }

    public function store(BillStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());
        $data['user_id'] = $user->id;

        try {
            $bill = Bill::create($data);
            $bill->load('category');
            return $this->success($bill, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar conta.');
        }
    }

    public function update(BillUpdateRequest $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);
        $data = $this->normalizeInsertData($request->validated());

        try {
            $bill->update($data);
            $bill->load('category');
            return $this->success($bill);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar conta.');
        }
    }

    public function destroy(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('delete', $bill);
        $bill->delete();

        return $this->success(['message' => 'Conta removida.']);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();
        $endOfMonth = $today->copy()->endOfMonth();

        $bills = Bill::where('user_id', $user->id)
            ->where('status', 'active')
            ->get()
            ->map(function (Bill $bill) use ($today, $endOfMonth) {
                $dueDate = $today->copy()->day($bill->due_day);
                if ($dueDate->lt($today)) {
                    $dueDate->addMonth();
                }

                $lastPayment = BillPayment::where('bill_id', $bill->id)
                    ->whereMonth('due_date', $dueDate->month)
                    ->whereYear('due_date', $dueDate->year)
                    ->first();

                $isOverdue = $dueDate->lt($today) && !$lastPayment;
                $isPaid = (bool) $lastPayment?->paid_date;

                return [
                    ...$bill->toArray(),
                    'due_date' => $dueDate->format('Y-m-d'),
                    'is_overdue' => $isOverdue,
                    'is_paid' => $isPaid,
                    'last_payment' => $lastPayment,
                    'days_until_due' => $today->diffInDays($dueDate, false),
                ];
            })
            ->sortBy('days_until_due')
            ->values();

        return $this->success($bills);
    }

    public function markAsPaid(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $request->validate([
            'amount_paid' => 'nullable|numeric|min:0.01|max:9999999999.99',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->billPaymentService->markBillAsPaid(
                $bill,
                $request->input('amount_paid', $bill->amount),
                $request->input('notes')
            );

            return $this->success($result);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao marcar conta como paga.');
        }
    }

    public function toggleStatus(Request $request, Bill $bill): JsonResponse
    {
        $this->authorize('update', $bill);

        $bill->status = $bill->status === 'active' ? 'inactive' : 'active';
        $bill->save();

        return $this->success($bill);
    }
}
