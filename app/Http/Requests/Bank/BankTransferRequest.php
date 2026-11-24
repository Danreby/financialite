<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;

class BankTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // A posse das contas é conferida em TransferBetweenAccounts (conta de
        // outro usuário responde 404, como nas demais rotas).
        return [
            'from_bank_user_id' => [
                'required',
                'integer',
                'different:to_bank_user_id',
            ],
            'to_bank_user_id' => [
                'required',
                'integer',
            ],
            'amount' => [
                'required',
                SafeNumeric::money(0.01, 999999999.99),
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
                new SafeString(500),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'from_bank_user_id.required' => 'Selecione a conta de origem.',
            'from_bank_user_id.different' => 'As contas de origem e destino devem ser diferentes.',
            'to_bank_user_id.required' => 'Selecione a conta de destino.',
            'amount.required' => 'O valor da transferência é obrigatório.',
            'description.max' => 'A descrição não pode ter mais de :max caracteres.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('description') && is_string($this->description)) {
            $this->merge(['description' => trim($this->description)]);
        }
    }
}
