<?php

namespace App\Actions\Transacao;

use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Resolve o cartão (card_user) e a conta bancária (bank_user) de um pagamento de
 * fatura, sempre no escopo do usuário. Compartilhada por PayFaturaMonth e
 * PayFaturaPartial.
 */
class ResolvePaymentAccounts
{
    /**
     * @param  array<string, mixed>  $data  chaves opcionais bank_user_id (cartão) e bank_account_id (conta)
     * @return array{0: ?CardUser, 1: ?BankUser}
     *
     * @throws ModelNotFoundException cartão ou conta de outro usuário
     */
    public function handle(User $user, array $data): array
    {
        $cardUser = ! empty($data['bank_user_id'])
            ? CardUser::forUser($user->id)->findOrFail($data['bank_user_id'])
            : null;

        $bankAccount = ! empty($data['bank_account_id'])
            ? BankUser::forUser($user->id)->findOrFail($data['bank_account_id'])
            : null;

        return [$cardUser, $bankAccount];
    }
}
