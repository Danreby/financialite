<?php

namespace App\Http\Requests\Budget;

use Illuminate\Foundation\Http\FormRequest;

class BudgetStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'monthly_limit' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'month_year' => ['required', 'string', 'date_format:Y-m'],
            'is_active' => ['nullable', 'boolean'],
            'category_limits' => ['nullable', 'array'],
            'category_limits.*.category_id' => ['required', 'integer', 'exists:categories,id'],
            'category_limits.*.limit' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ];
    }

    public function messages(): array
    {
        return [
            'monthly_limit.required' => 'O limite mensal é obrigatório.',
            'monthly_limit.min' => 'O limite mensal deve ser maior ou igual a zero.',
            'month_year.required' => 'O mês/ano é obrigatório.',
            'month_year.date_format' => 'O formato do mês/ano deve ser YYYY-MM.',
            'category_limits.*.category_id.exists' => 'Categoria inválida.',
            'category_limits.*.limit.min' => 'O limite da categoria deve ser maior ou igual a zero.',
        ];
    }
}
