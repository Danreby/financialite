<?php

namespace App\Actions\Transacao;

use App\Models\User;
use App\Services\FaturaPaymentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Registra um pagamento parcial da fatura de um mês.
 *
 * Usada por TransacaoController::payPartial (web). A API não tem rota de
 * pagamento parcial; quando tiver, deve chamar esta Action.
 */
class PayFaturaPartial
{
    public function __construct(private FaturaPaymentService $payments) {}

    /**
     * @param  array{month: string, amount: string|int|float, bank_user_id?: int|string|null, bank_account_id?: int|string|null}  $data
     * @return array{total_paid: int|float, total_due: int|float, amount_paid_now: int|float, is_fully_paid: bool}
     *
     * @throws ModelNotFoundException cartão ou conta de outro usuário
     * @throws \DomainException nada a pagar, fatura quitada ou saldo insuficiente
     */
    public function handle(User $user, array $data): array
    {
        [$cardUser, $bankAccount] = PayFaturaMonth::resolveAccounts($user, $data);

        return $this->payments->payPartialForUser($user, $data['month'], $data['amount'], $cardUser, $bankAccount);
    }
}
