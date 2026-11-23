<?php

namespace App\Http\Requests\Bill;

use App\Models\Bill;
use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use InvalidArgumentException;

class BillMarkPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Conta de outro usuário fica sem teto aqui; a Action responde 404.
        $bill = Bill::forUser((int) $this->user()?->id)->find((int) $this->route('bill'));
        $billCents = $bill?->amount !== null ? Money::fromDecimal((string) $bill->amount) : null;

        return [
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'amount_paid' => [
                'nullable',
                'numeric',
                'gt:0',
                'max:9999999999.99',
                function (string $attribute, mixed $value, \Closure $fail) use ($billCents) {
                    // Valor não numérico ou fora do limite já falha nas regras acima.
                    if ($billCents === null || ! is_numeric($value)) {
                        return;
                    }
                    try {
                        $paidCents = Money::fromDecimal($value);
                    } catch (InvalidArgumentException) {
                        return;
                    }
                    if ($paidCents > $billCents) {
                        $fail('O valor pago não pode ser maior que o valor da conta.');
                    }
                },
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.required' => 'Informe o vencimento.',
            'amount_paid.gt' => 'O valor pago deve ser maior que zero.',
        ];
    }
}
