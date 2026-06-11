<?php

namespace App\Http\Requests\Income;

use App\Models\Income;
use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IncomeUpdateRequest extends FormRequest
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
            'is_recurring' => [
                'sometimes',
                'boolean',
            ],
            'payment_day_type' => [
                'required_if:is_recurring,true,1',
                'nullable',
                Rule::in(Income::VALID_PAYMENT_DAY_TYPES),
            ],
            'payment_day_value' => [
                'required_if:is_recurring,true,1',
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
            'received_at' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
            'bank_user_id' => [
                'nullable',
                'integer',
                Rule::exists('card_user', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'bank_account_id' => [
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
            'title.required' => 'O título é obrigatório.',
            'title.min' => 'O título deve ter pelo menos :min caracteres.',
            'title.max' => 'O título não pode ter mais de :max caracteres.',
            'amount.required' => 'O valor é obrigatório.',
            'type.required' => 'O tipo de renda é obrigatório.',
            'type.in' => 'O tipo de renda informado é inválido.',
            'payment_day_type.required_if' => 'O tipo de dia de pagamento é obrigatório para rendas recorrentes.',
            'payment_day_type.in' => 'O tipo de dia de pagamento informado é inválido.',
            'payment_day_value.required_if' => 'O dia de pagamento é obrigatório para rendas recorrentes.',
            'payment_day_value.min' => 'O dia de pagamento deve ser no mínimo 1.',
            'payment_day_value.max' => 'O dia de pagamento deve ser no máximo 31.',
            'received_at.date' => 'A data de recebimento deve ser uma data válida.',
            'received_at.before_or_equal' => 'A data de recebimento não pode ser no futuro.',
            'bank_user_id.exists' => 'A conta bancária selecionada não existe ou não pertence a você.',
            'bank_account_id.exists' => 'A conta bancária selecionada não existe ou não pertence a você.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        if ($this->has('is_recurring')) {
            $this->merge([
                'is_recurring' => filter_var($this->is_recurring, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        $isRecurring = filter_var($this->is_recurring ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if (! $isRecurring) {
            if (! $this->has('payment_day_type') || ! $this->payment_day_type) {
                $this->merge(['payment_day_type' => 'fixed']);
            }
            if (! $this->has('payment_day_value') || ! $this->payment_day_value) {
                $this->merge(['payment_day_value' => 1]);
            }
        }

        if ($this->has('title')) {
            $this->merge(['title' => trim($this->title)]);
        }

        if ($this->has('description') && is_string($this->description)) {
            $this->merge(['description' => trim($this->description)]);
        }
    }
}
