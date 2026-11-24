<?php

namespace App\Http\Requests\Bill;

use App\Enums\BillStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BillStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric', 'min:0.01', 'max:9999999999.99'],
            'recurrence_type' => ['required', 'in:none,monthly,yearly'],
            'due_day' => ['required', 'integer', 'min:1', 'max:31'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::enum(BillStatus::class)],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $userId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'O título é obrigatório.',
            'amount.min' => 'O valor deve ser maior que zero.',
            'due_day.required' => 'O dia de vencimento é obrigatório.',
            'due_day.min' => 'O dia deve ser entre 1 e 31.',
            'due_day.max' => 'O dia deve ser entre 1 e 31.',
            'end_date.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',
            'color.regex' => 'A cor deve estar no formato hexadecimal (#RRGGBB).',
            'category_id.exists' => 'A categoria selecionada não existe ou não pertence a você.',
        ];
    }
}
