<?php

namespace App\Http\Requests\Bill;

use Illuminate\Foundation\Http\FormRequest;

class BillMarkPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bill = $this->route('bill');
        $billCents = $bill?->amount !== null ? (int) round(((float) $bill->amount) * 100) : null;

        return [
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'amount_paid' => [
                'nullable',
                'numeric',
                'gt:0',
                'max:9999999999.99',
                function (string $attribute, mixed $value, \Closure $fail) use ($billCents) {
                    if ($billCents !== null && (int) round(((float) $value) * 100) > $billCents) {
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
