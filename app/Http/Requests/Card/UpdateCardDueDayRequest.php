<?php

namespace App\Http\Requests\Card;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCardDueDayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'brand' => [
                'nullable',
                'string',
                'max:50',
                Rule::in(\App\Models\Card::VALID_BRANDS),
            ],
            'description' => ['nullable', 'string', 'max:500', new SafeString(500)],
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ];
    }

    public function messages(): array
    {
        return [
            'due_day.min' => 'O dia de vencimento deve ser entre 1 e 31.',
            'due_day.max' => 'O dia de vencimento deve ser entre 1 e 31.',
            'closing_day.min' => 'O dia de fechamento deve ser entre 1 e 31.',
            'closing_day.max' => 'O dia de fechamento deve ser entre 1 e 31.',
            'brand.in' => 'A bandeira selecionada é inválida.',
            'description.max' => 'A descrição não pode ter mais de :max caracteres.',
            'credit_limit.min' => 'O limite de crédito deve ser um valor positivo.',
        ];
    }
}
