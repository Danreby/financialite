<?php

namespace App\Http\Requests\Fatura;

use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FaturaUpdateRequest extends FormRequest
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
                'sometimes',
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
                'sometimes',
                'required',
                SafeNumeric::money(0.01, 999999999.99),
            ],
            'type' => [
                'sometimes',
                'required',
                Rule::in(['credit', 'debit']),
            ],
            'status' => [
                'nullable',
                Rule::in(['paid', 'unpaid', 'overdue']),
            ],
            'paid_date' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'total_installments' => [
                'nullable',
                'integer',
                'min:1',
                'max:360',
            ],
            'current_installment' => [
                'nullable',
                'integer',
                'min:0',
                'max:360',
                'lte:total_installments',
            ],
            'is_recurring' => [
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
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where(function ($query) use ($userId) {
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
            'type.required' => 'O tipo é obrigatório.',
            'type.in' => 'O tipo deve ser crédito ou débito.',
            'status.in' => 'O status informado é inválido.',
            'paid_date.before_or_equal' => 'A data de pagamento não pode ser no futuro.',
            'total_installments.min' => 'O número de parcelas deve ser pelo menos 1.',
            'total_installments.max' => 'O número de parcelas não pode exceder 360.',
            'bank_user_id.exists' => 'A conta bancária selecionada não existe ou não pertence a você.',
            'category_id.exists' => 'A categoria selecionada não existe ou não pertence a você.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_recurring')) {
            $this->merge([
                'is_recurring' => filter_var($this->is_recurring, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            ]);
        }

        if ($this->has('title') && is_string($this->title)) {
            $this->merge(['title' => trim($this->title)]);
        }
        
        if ($this->has('description') && is_string($this->description)) {
            $this->merge(['description' => trim($this->description)]);
        }
    }
}
