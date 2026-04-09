<?php

namespace App\Http\Requests\Category;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;
        $categoryParam = $this->route('category');
        $categoryId = is_object($categoryParam) && method_exists($categoryParam, 'getKey')
            ? $categoryParam->getKey()
            : $categoryParam;

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new SafeString(255),
                Rule::unique('categories')
                    ->ignore($categoryId)
                    ->whereNull('deleted_at')
                    ->where(fn ($query) => $query->where('user_id', $userId)),
            ],
            'color' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
            ],
            'icon' => [
                'nullable',
                'string',
                'max:50',
            ],
            'type' => [
                'sometimes',
                'string',
                Rule::in(\App\Models\Category::VALID_TYPES),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome da categoria é obrigatório.',
            'name.min' => 'O nome deve ter pelo menos :min caracteres.',
            'name.max' => 'O nome não pode ter mais de :max caracteres.',
            'name.unique' => 'Você já possui uma categoria com este nome.',
            'color.regex' => 'A cor deve estar no formato hexadecimal (#RRGGBB ou #RGB).',
            'color.max' => 'A cor não pode ter mais de :max caracteres.',
            'icon.max' => 'O ícone não pode ter mais de :max caracteres.',
            'type.in' => 'O tipo deve ser receita ou despesa.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
