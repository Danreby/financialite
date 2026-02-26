<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeNumeric;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BankStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'bank_id' => [
                'required',
                'integer',
                Rule::exists('banks', 'id')->whereNull('deleted_at'),
            ],
            'balance' => [
                'nullable',
                SafeNumeric::money(-999999999.99, 999999999.99),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bank_id.required' => 'Selecione um banco.',
            'bank_id.integer'  => 'Banco inválido.',
            'bank_id.exists'   => 'O banco selecionado não existe ou está indisponível.',
            'balance.min'      => 'O saldo deve ser um valor positivo.',
        ];
    }
}
