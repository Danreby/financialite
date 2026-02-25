<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeString;
use App\Security\Rules\SafeNumeric;
use Illuminate\Foundation\Http\FormRequest;

class BankStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new SafeString(255),
            ],
            'balance' => [
                'nullable',
                SafeNumeric::money(0, 999999999.99),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do banco é obrigatório.',
            'name.min' => 'O nome deve ter pelo menos :min caracteres.',
            'name.max' => 'O nome não pode ter mais de :max caracteres.',
            'balance.min' => 'O saldo deve ser um valor positivo.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
