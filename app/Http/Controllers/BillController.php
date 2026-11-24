<?php

namespace App\Http\Controllers;

use App\Actions\Bill\CreateBill;
use App\Actions\Bill\DeleteBill;
use App\Actions\Bill\DeleteBillPayment;
use App\Actions\Bill\MarkBillAsPaid;
use App\Actions\Bill\ToggleBillStatus;
use App\Actions\Bill\UpdateBill;
use App\Actions\Bill\UpdateBillPayment;
use App\Enums\BillStatus;
use App\Http\Requests\Bill\BillMarkPaidRequest;
use App\Http\Requests\Bill\BillPaymentUpdateRequest;
use App\Http\Requests\Bill\BillStoreRequest;
use App\Http\Requests\Bill\BillUpdateRequest;
use App\Models\Bill;
use App\Models\Category;
use App\Queries\BillListQuery;
use App\Queries\UpcomingBillsQuery;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request, BillListQuery $bills): JsonResponse
    {
        $this->authorize('viewAny', Bill::class);

        return $this->success($bills->get($request->user()));
    }

    public function store(BillStoreRequest $request, CreateBill $createBill): JsonResponse
    {
        $this->authorize('create', Bill::class);

        $user = $request->user();
        $bill = $createBill->handle($user, $request->validated());

        $this->notifications->success($user, 'Conta cadastrada', 'Nova conta a pagar foi adicionada com sucesso.');

        return $this->success($bill->load('category:id,name,color,icon'), 201);
    }

    public function update(BillUpdateRequest $request, int $bill, UpdateBill $updateBill): JsonResponse
    {
        $user = $request->user();
        $updated = $updateBill->handle($user, $bill, $request->validated());

        $this->notifications->info($user, 'Conta atualizada', 'A conta foi atualizada com sucesso.');

        return $this->success($updated->load('category:id,name,color,icon'));
    }

    public function destroy(Request $request, int $bill, DeleteBill $deleteBill): JsonResponse
    {
        $user = $request->user();
        $deleteBill->handle($user, $bill);

        $this->notifications->info($user, 'Conta removida', 'A conta foi removida com sucesso.');

        return $this->success(['message' => 'Conta removida com sucesso.']);
    }

    public function upcoming(Request $request, UpcomingBillsQuery $upcoming): JsonResponse
    {
        $this->authorize('viewAny', Bill::class);

        return $this->success($upcoming->get($request->user(), (int) $request->input('days', 30)));
    }

    public function markAsPaid(BillMarkPaidRequest $request, int $bill, MarkBillAsPaid $markBillAsPaid): JsonResponse
    {
        return $this->success($markBillAsPaid->handle($request->user(), $bill, $request->validated()));
    }

    public function updatePayment(BillPaymentUpdateRequest $request, int $bill, int $payment, UpdateBillPayment $updatePayment): JsonResponse
    {
        return $this->success($updatePayment->handle($request->user(), $bill, $payment, $request->validated()));
    }

    public function destroyPayment(Request $request, int $bill, int $payment, DeleteBillPayment $deletePayment): JsonResponse
    {
        $deletePayment->handle($request->user(), $bill, $payment);

        return $this->success(['message' => 'Pagamento removido do histórico.']);
    }

    public function toggleStatus(Request $request, int $bill, ToggleBillStatus $toggleBillStatus): JsonResponse
    {
        $user = $request->user();
        $updated = $toggleBillStatus->handle($user, $bill);

        $label = $updated->status === BillStatus::Active ? 'ativada' : 'desativada';
        $this->notifications->info($user, 'Conta '.$label, 'A conta foi '.$label.' com sucesso.');

        return $this->success($updated);
    }

    public function page(Request $request, BillListQuery $bills): InertiaResponse
    {
        $user = $request->user();

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Contas', [
            'bills' => $bills->get($user),
            'categories' => $categories,
        ]);
    }
}
