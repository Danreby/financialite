<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class PeriodSpendingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month_from' => ['required', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'month_to' => [
                'required',
                'string',
                'regex:/^\d{4}-(0[1-9]|1[0-2])$/',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $monthFrom = $this->input('month_from');

                    if ($monthFrom && $value < $monthFrom) {
                        $fail('O mês final deve ser igual ou posterior ao mês inicial.');
                    }

                    if ($monthFrom) {
                        $from = \Carbon\Carbon::createFromFormat('Y-m', $monthFrom)->startOfMonth();
                        $to = \Carbon\Carbon::createFromFormat('Y-m', $value)->startOfMonth();

                        if ($from->diffInMonths($to) > 12) {
                            $fail('O período não pode exceder 12 meses.');
                        }
                    }
                },
            ],
            'bank_user_id' => ['nullable', 'integer', 'min:1'],
            'category_id' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'month_from.required' => 'O mês inicial é obrigatório.',
            'month_from.regex' => 'O mês inicial deve estar no formato YYYY-MM.',
            'month_to.required' => 'O mês final é obrigatório.',
            'month_to.regex' => 'O mês final deve estar no formato YYYY-MM.',
        ];
    }
}
