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
        return [
            'due_date' => ['required', 'date'],
            'paid_date' => ['nullable', 'date'],
            'amount_paid' => ['nullable', 'numeric', 'gt:0', 'max:9999999999.99'],
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
