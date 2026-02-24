<?php

namespace App\Http\Requests\Card;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;

class CardUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $cardId = $this->route('card');

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'unique:cards,name,' . $cardId,
                new SafeString(255),
            ],
            'due_day' => [
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do cartão é obrigatório.',
            'name.min' => 'O nome deve ter pelo menos :min caracteres.',
            'name.max' => 'O nome não pode ter mais de :max caracteres.',
            'name.unique' => 'Já existe um cartão com este nome.',
            'due_day.min' => 'O dia de vencimento deve ser entre 1 e 31.',
            'due_day.max' => 'O dia de vencimento deve ser entre 1 e 31.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
