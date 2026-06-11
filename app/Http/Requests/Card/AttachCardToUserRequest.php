<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;

class AttachCardToUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'card_id' => 'required|exists:cards,id',
            'due_day' => 'required|integer|min:1|max:31',
            'closing_day' => 'required|integer|min:1|max:31',
            'brand' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ];
    }

    public function messages(): array
    {
        return [
            'due_day.required' => 'O dia de vencimento é obrigatório.',
            'due_day.min' => 'O dia de vencimento deve ser entre 1 e 31.',
            'due_day.max' => 'O dia de vencimento deve ser entre 1 e 31.',
            'closing_day.required' => 'O dia de fechamento é obrigatório.',
            'closing_day.min' => 'O dia de fechamento deve ser entre 1 e 31.',
            'closing_day.max' => 'O dia de fechamento deve ser entre 1 e 31.',
        ];
    }
}
