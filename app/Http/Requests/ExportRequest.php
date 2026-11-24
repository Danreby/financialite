<?php

namespace App\Http\Requests;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Filtros das exportações em planilha (os mesmos da tela Relatórios). */
class ExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'bank_user_id' => ['nullable', 'integer', 'min:1'],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()?->id),
            ],
            'year' => ['nullable', 'string', 'regex:/^\d{4}$/'],
            'search' => ['nullable', 'string', 'max:255', new SafeString],
        ];
    }
}
