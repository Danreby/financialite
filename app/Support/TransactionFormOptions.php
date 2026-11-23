<?php

namespace App\Support;

use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;

/**
 * Listas que o formulário de nova transação (ExpenseForm) precisa:
 * cartões do usuário, contas bancárias para débito e categorias.
 * Usado pelo Dashboard e pelo botão global "Nova transação".
 */
class TransactionFormOptions
{
    /**
     * @return array{bankAccounts: \Illuminate\Support\Collection, categories: \Illuminate\Support\Collection, bankAccountsList: \Illuminate\Support\Collection}
     */
    public static function forUser(int $userId): array
    {
        $bankAccounts = CardUser::with('card')
            ->forUser($userId)
            ->get()
            ->map(fn ($cardUser) => [
                'id' => $cardUser->id,
                'name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
                'due_day' => $cardUser->due_day,
                'closing_day' => $cardUser->closing_day,
                'credit_limit' => $cardUser->credit_limit,
                'brand' => $cardUser->card?->brand,
            ]);

        $categories = Category::forUser($userId)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color', 'type']);

        $bankAccountsList = BankUser::with('bank')
            ->forUser($userId)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Banco #'.$bu->id),
                'balance' => (float) $bu->balance,
            ]);

        return [
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
            'bankAccountsList' => $bankAccountsList,
        ];
    }
}
