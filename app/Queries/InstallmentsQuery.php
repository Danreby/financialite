<?php

namespace App\Queries;

use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Dados da página "Parcelamentos": compras com mais de uma parcela, com o
 * cronograma gravado, primeiro mês de cobrança e mês de término. Só lê.
 *
 * Usada por TransacaoController::installments.
 */
class InstallmentsQuery
{
    /** @return array{installments: Collection<int, array<string, mixed>>, bankAccounts: Collection<int, array{id: int, name: string}>, categories: \Illuminate\Database\Eloquent\Collection<int, Category>} */
    public function get(User $user): array
    {
        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id' => $cu->id,
                'name' => $cu->card->name ?? ('Cartão #'.$cu->id),
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $installments = Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->where('user_id', $user->id)
            ->where('total_installments', '>', 1)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Transacao $tx) => $this->row($tx));

        return [
            'installments' => $installments,
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
        ];
    }

    /** @return array<string, mixed> */
    private function row(Transacao $tx): array
    {
        $totalInstallments = (int) ($tx->total_installments ?? 1);
        $currentInstallment = (int) ($tx->current_installment ?? 0);

        $createdAt = Carbon::parse($tx->created_at);
        $dueDay = $tx->bankUser->due_day ?? 1;

        $firstBillingMonth = $createdAt->day <= $dueDay
            ? $createdAt->copy()->startOfMonth()
            : $createdAt->copy()->addMonthNoOverflow()->startOfMonth();

        $completionDate = $firstBillingMonth->copy()->addMonthsNoOverflow($totalInstallments - 1);

        return [
            'id' => $tx->id,
            'title' => $tx->title,
            'description' => $tx->description,
            'amount' => (float) $tx->amount,
            'installment_amount' => (float) $tx->getInstallmentAmount(),
            'total_installments' => $totalInstallments,
            'current_installment' => $currentInstallment,
            'remaining_installments' => max($totalInstallments - $currentInstallment, 0),
            'status' => $tx->status->value,
            'created_at' => $tx->created_at,
            'first_billing_month' => $firstBillingMonth->format('Y-m'),
            'completion_month' => $completionDate->format('Y-m'),
            'bank_user_id' => $tx->bankUser?->id,
            'bank_name' => $tx->bankUser?->card?->name,
            'category_id' => $tx->category?->id,
            'category_name' => $tx->category?->name,
            'category_icon' => $tx->category?->icon,
            'category_color' => $tx->category?->color,
            'type' => $tx->type->value,
            'parcelas' => $tx->parcelas->map(fn ($p) => [
                'installment_number' => $p->installment_number,
                'amount' => (float) $p->amount,
                'due_date' => $p->due_date->format('Y-m-d'),
                'status' => $p->status->value,
                'paid_date' => $p->paid_date?->format('Y-m-d'),
            ])->values()->toArray(),
        ];
    }
}
