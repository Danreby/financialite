<?php

namespace App\Http\Controllers;

use App\Contracts\Services\ResumoMensalServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ResumoMensalController extends Controller
{
    public function __construct(
        private ResumoMensalServiceInterface $resumoService,
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id' => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
            ]);

        $bankAccountsList = BankUser::with('bank')
            ->forUser($user->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Banco #' . $bu->id),
                'balance' => (float) $bu->balance,
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color', 'type']);

        return Inertia::render('ResumoMensal', [
            'bankAccounts' => $bankAccounts,
            'bankAccountsList' => $bankAccountsList,
            'categories' => $categories,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $request->validate([
            'month_key' => ['nullable', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);

        $user = $request->user();
        $filters = $request->only(['month_key']);

        $result = $this->resumoService->buildResumoMensal($user, $filters);

        return $this->success($result);
    }
}
