<?php

namespace App\Http\Requests\Card;

use App\Models\Card;
use App\Rules\UniqueIgnoringCase;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CardUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // A única rota que usa esta request é api/v1/card-resources/{card_resource}.
        $cardParam = $this->route('card_resource') ?? $this->route('card');
        $cardId = is_object($cardParam) && method_exists($cardParam, 'getKey')
            ? $cardParam->getKey()
            : $cardParam;

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new UniqueIgnoringCase(
                    'cards',
                    'Já existe um cartão com este nome.',
                    fn ($q) => $q->where(
                        fn ($w) => $w->whereNull('user_id')->orWhere('user_id', $this->user()->id)
                    ),
                    $cardId,
                ),
                new SafeString(255),
            ],
            'due_day' => [
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
            'brand' => [
                'nullable',
                'string',
                'max:50',
                Rule::in(Card::VALID_BRANDS),
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
                new SafeString(500),
            ],
            'closing_day' => [
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
            'credit_limit' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999.99',
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
            'brand.in' => 'A bandeira selecionada é inválida.',
            'description.max' => 'A descrição não pode ter mais de :max caracteres.',
            'closing_day.min' => 'O dia de fechamento deve ser entre 1 e 31.',
            'closing_day.max' => 'O dia de fechamento deve ser entre 1 e 31.',
            'credit_limit.min' => 'O limite de crédito deve ser um valor positivo.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
