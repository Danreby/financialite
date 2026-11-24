<?php

namespace App\Actions\Transacao;

use App\Exceptions\InsufficientBalanceException;
use App\Models\User;
use App\Services\FaturaPaymentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Paga o que falta da fatura de um mês, debitando da conta escolhida.
 *
 * Usada por TransacaoController::payMonth (web) e TransacaoApiController::payMonth.
 * O travamento (lockForUpdate) e a checagem de saldo ficam no FaturaPaymentService.
 */
class PayFaturaMonth
{
    public function __construct(
        private FaturaPaymentService $payments,
        private ResolvePaymentAccounts $resolveAccounts,
    ) {}

    /**
     * @param  array{month: string, bank_user_id?: int|string|null, bank_account_id?: int|string|null}  $data
     * @return float valor pago agora (0 quando não havia nada pendente)
     *
     * @throws ModelNotFoundException cartão ou conta de outro usuário
     * @throws InsufficientBalanceException
     */
    public function handle(User $user, array $data): float
    {
        [$cardUser, $bankAccount] = $this->resolveAccounts->handle($user, $data);

        return $this->payments->payMonthForUser($user, $data['month'], $cardUser, $bankAccount);
    }
}
