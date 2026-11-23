<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Bill\CreateBill;
use App\Actions\Bill\DeleteBill;
use App\Actions\Bill\MarkBillAsPaid;
use App\Actions\Bill\ToggleBillStatus;
use App\Actions\Bill\UpdateBill;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bill\BillMarkPaidRequest;
use App\Http\Requests\Bill\BillStoreRequest;
use App\Http\Requests\Bill\BillUpdateRequest;
use App\Models\Bill;
use App\Models\BillPayment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillApiController extends Controller
{
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

    public function store(BillStoreRequest $request, CreateBill $createBill): JsonResponse
    {
        try {
            $bill = $createBill->handle($request->user(), $request->validated());

            return $this->success($bill->load('category'), 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar conta.');
        }
    }

    public function update(BillUpdateRequest $request, int $bill, UpdateBill $updateBill): JsonResponse
    {
        try {
            $updated = $updateBill->handle($request->user(), $bill, $request->validated());

            return $this->success($updated->load('category'));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar conta.');
        }
    }

    public function destroy(Request $request, int $bill, DeleteBill $deleteBill): JsonResponse
    {
        $deleteBill->handle($request->user(), $bill);

        return $this->success(['message' => 'Conta removida.']);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        $bills = Bill::where('user_id', $user->id)
            ->where('status', 'active')
            ->get()
            ->map(function (Bill $bill) use ($today) {
                $dueDate = $today->copy()->day($bill->due_day);
                if ($dueDate->lt($today)) {
                    $dueDate->addMonthNoOverflow();
                }

                $lastPayment = BillPayment::where('bill_id', $bill->id)
                    ->whereMonth('due_date', $dueDate->month)
                    ->whereYear('due_date', $dueDate->year)
                    ->first();

                $isOverdue = $dueDate->lt($today) && ! $lastPayment;
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

    public function markAsPaid(BillMarkPaidRequest $request, int $bill, MarkBillAsPaid $markBillAsPaid): JsonResponse
    {
        try {
            return $this->success($markBillAsPaid->handle($request->user(), $bill, $request->validated()));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao marcar conta como paga.');
        }
    }

    public function toggleStatus(Request $request, int $bill, ToggleBillStatus $toggleBillStatus): JsonResponse
    {
        return $this->success($toggleBillStatus->handle($request->user(), $bill));
    }
}
