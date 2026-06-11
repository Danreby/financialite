<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BankTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'from_bank_user_id' => [
                'required',
                'integer',
                'different:to_bank_user_id',
                Rule::exists('bank_user', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'to_bank_user_id' => [
                'required',
                'integer',
                Rule::exists('bank_user', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
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
            'from_bank_user_id.exists' => 'A conta de origem não existe ou não pertence a você.',
            'from_bank_user_id.different' => 'As contas de origem e destino devem ser diferentes.',
            'to_bank_user_id.required' => 'Selecione a conta de destino.',
            'to_bank_user_id.exists' => 'A conta de destino não existe ou não pertence a você.',
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
