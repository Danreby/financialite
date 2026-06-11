<?php

namespace App\Http\Requests;

use App\Models\Transacao;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransactionIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'search' => ['nullable', 'string', 'max:255', new SafeString],
            'type' => ['nullable', 'string', Rule::in(Transacao::VALID_TYPES)],
            'status' => ['nullable', 'string', Rule::in(Transacao::VALID_STATUSES)],
            'bank_user_id' => [
                'nullable',
                'integer',
                Rule::exists('bank_user', 'id')->where('user_id', $userId),
            ],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $userId),
            ],
            'month' => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'order' => [
                'nullable',
                'string',
                Rule::in([
                    'created_desc',
                    'created_asc',
                    'amount_desc',
                    'amount_asc',
                    'title_asc',
                    'title_desc',
                ]),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('search') && is_string($this->search)) {
            $this->merge(['search' => trim($this->search)]);
        }

        foreach (['bank_user_id', 'category_id', 'per_page', 'page'] as $field) {
            if ($this->has($field) && is_numeric($this->$field)) {
                $this->merge([$field => (int) $this->$field]);
            }
        }
    }

    public function messages(): array
    {
        return [
            'search.max' => 'O termo de busca deve ter no máximo :max caracteres.',
            'type.in' => 'O tipo selecionado é inválido.',
            'status.in' => 'O status selecionado é inválido.',
            'bank_user_id.exists' => 'A conta bancária selecionada não existe ou não pertence a você.',
            'category_id.exists' => 'A categoria selecionada não existe ou não pertence a você.',
            'month.regex' => 'O mês deve estar no formato AAAA-MM.',
            'order.in' => 'A ordenação selecionada é inválida.',
            'per_page.min' => 'O número de itens por página deve ser pelo menos :min.',
            'per_page.max' => 'O número de itens por página deve ser no máximo :max.',
            'page.min' => 'O número da página deve ser pelo menos :min.',
        ];
    }

    public function attributes(): array
    {
        return [
            'search' => 'busca',
            'type' => 'tipo',
            'status' => 'status',
            'bank_user_id' => 'conta bancária',
            'category_id' => 'categoria',
            'month' => 'mês',
            'order' => 'ordenação',
            'per_page' => 'itens por página',
            'page' => 'página',
        ];
    }
}
