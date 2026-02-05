<?php

namespace App\Http\Controllers;

use App\Contracts\Services\ExtratoServiceInterface;
use App\Models\BankUser;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExtratoController extends Controller
{
    public function __construct(
        private ExtratoServiceInterface $extratoService
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $bankAccounts = BankUser::with('bank')
            ->forUser($user->id)
            ->get()
            ->map(fn ($bu) => [
                'id'   => $bu->id,
                'name' => $bu->bank?->name ?? ('Conta #' . $bu->id),
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Extrato', [
            'bankAccounts' => $bankAccounts,
            'categories'   => $categories,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $request->validate([
            'start_date'   => ['nullable', 'date', 'after_or_equal:' . now()->subYears(2)->toDateString()],
            'end_date'     => ['nullable', 'date', 'after_or_equal:start_date', 'before_or_equal:' . now()->addYear()->toDateString()],
            'bank_user_id' => ['nullable', 'integer'],
            'category_id'  => ['nullable', 'integer'],
            'type'         => ['nullable', 'string', 'in:credit,debit'],
        ]);

        $user = $request->user();

        if ($request->filled('bank_user_id')) {
            BankUser::forUser($user->id)->findOrFail($request->input('bank_user_id'));
        }

        if ($request->filled('category_id')) {
            Category::forUser($user->id)->findOrFail($request->input('category_id'));
        }

        $filters = $request->only(['start_date', 'end_date', 'bank_user_id', 'category_id', 'type']);

        $result = $this->extratoService->buildExtrato($user, $filters);

        return response()->json($result);
    }
}
