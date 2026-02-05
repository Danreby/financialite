<?php

namespace App\Http\Requests\Income;

use App\Models\Income;
use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IncomeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'title' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new SafeString(255),
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
                new SafeString(1000),
            ],
            'amount' => [
                'required',
                SafeNumeric::money(0.01, 999999999.99),
            ],
            'type' => [
                'required',
                Rule::in(Income::VALID_TYPES),
            ],
            'payment_day_type' => [
                'required',
                Rule::in(Income::VALID_PAYMENT_DAY_TYPES),
            ],
            'payment_day_value' => [
                'required',
                'integer',
                'min:1',
                'max:31',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
            'bank_user_id' => [
                'nullable',
                'integer',
                Rule::exists('bank_user', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'            => 'O título é obrigatório.',
            'title.min'                 => 'O título deve ter pelo menos :min caracteres.',
            'title.max'                 => 'O título não pode ter mais de :max caracteres.',
            'amount.required'           => 'O valor é obrigatório.',
            'type.required'             => 'O tipo de renda é obrigatório.',
            'type.in'                   => 'O tipo de renda informado é inválido.',
            'payment_day_type.required' => 'O tipo de dia de pagamento é obrigatório.',
            'payment_day_type.in'       => 'O tipo de dia de pagamento informado é inválido.',
            'payment_day_value.required'=> 'O dia de pagamento é obrigatório.',
            'payment_day_value.min'     => 'O dia de pagamento deve ser no mínimo 1.',
            'payment_day_value.max'     => 'O dia de pagamento deve ser no máximo 31.',
            'bank_user_id.exists'       => 'A conta bancária selecionada não existe ou não pertence a você.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        if ($this->has('title')) {
            $this->merge(['title' => trim($this->title)]);
        }

        if ($this->has('description') && is_string($this->description)) {
            $this->merge(['description' => trim($this->description)]);
        }
    }
}
