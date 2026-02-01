<?php

namespace App\Http\Requests\Anexo;

use Illuminate\Foundation\Http\FormRequest;

class AnexoUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'description' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'description.max' => 'A descrição não pode exceder 500 caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'description' => 'descrição',
        ];
    }
}
