<?php

namespace App\Http\Requests\Bill;

use App\Support\Money;
use Illuminate\Foundation\Http\FormRequest;
use InvalidArgumentException;

class BillPaymentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bill = $this->route('bill');
        $billCents = $bill?->amount !== null ? Money::fromDecimal((string) $bill->amount) : null;

        return [
            'amount_paid' => [
                'required',
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
            'amount_due' => ['nullable', 'numeric', 'min:0'],
            'paid_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount_paid.required' => 'Informe o valor pago.',
            'amount_paid.numeric' => 'O valor pago deve ser um número.',
            'amount_paid.gt' => 'O valor pago deve ser maior que zero.',
        ];
    }
}
