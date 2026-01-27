<?php

namespace App\Http\Requests\Category;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new SafeString(255),
                Rule::unique('categories')
                    ->where(fn ($query) => $query->where('user_id', $userId)),
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
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
