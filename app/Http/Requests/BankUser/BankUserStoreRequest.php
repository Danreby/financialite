<?php

namespace App\Http\Requests\BankUser;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BankUserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'bank_id' => [
                'required',
                'integer',
                'exists:banks,id',
            ],
            'due_day' => [
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bank_id.required' => 'O banco é obrigatório.',
            'bank_id.exists' => 'O banco selecionado não existe.',
            'due_day.min' => 'O dia de vencimento deve ser entre 1 e 31.',
            'due_day.max' => 'O dia de vencimento deve ser entre 1 e 31.',
            'description.max' => 'A descrição não pode ter mais de :max caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_id' => 'banco',
            'due_day' => 'dia de vencimento',
            'description' => 'descrição',
        ];
    }
}
