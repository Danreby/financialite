<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;

class BankUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'balance' => [
                'required',
                SafeNumeric::money(0, 999999999.99),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'balance.required' => 'O saldo é obrigatório.',
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
