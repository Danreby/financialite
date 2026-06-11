<?php

namespace App\Http\Requests\Fatura;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayPartialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'month' => 'required|date_format:Y-m',
            'amount' => 'required|numeric|min:0.01|max:999999999.99',
            'bank_user_id' => [
                'nullable',
                Rule::exists('card_user', 'id')->where(fn ($q) => $q->where('user_id', $userId)),
            ],
            'bank_account_id' => [
                'nullable',
                Rule::exists('bank_user', 'id')->where(fn ($q) => $q->where('user_id', $userId)),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'O valor do pagamento é obrigatório.',
            'amount.numeric' => 'O valor do pagamento deve ser numérico.',
            'amount.min' => 'O valor mínimo de pagamento é R$ 0,01.',
            'month.required' => 'O mês de pagamento é obrigatório.',
            'month.date_format' => 'O formato do mês é inválido (esperado: AAAA-MM).',
        ];
    }
}
