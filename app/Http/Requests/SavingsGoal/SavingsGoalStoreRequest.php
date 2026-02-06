<?php

namespace App\Http\Requests\SavingsGoal;

use App\Models\SavingsGoal;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavingsGoalStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title'          => ['required', 'string', 'min:2', 'max:255', new SafeString(255)],
            'description'    => ['nullable', 'string', 'max:1000'],
            'target_amount'  => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'current_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'type'           => ['required', Rule::in(SavingsGoal::VALID_TYPES)],
            'icon'           => ['nullable', 'string', 'max:10'],
            'color'          => ['nullable', 'string', 'max:20'],
            'is_active'      => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'         => 'O título é obrigatório.',
            'title.min'              => 'O título deve ter pelo menos :min caracteres.',
            'target_amount.required' => 'O valor da meta é obrigatório.',
            'target_amount.min'      => 'O valor da meta deve ser maior que zero.',
            'type.required'          => 'O tipo é obrigatório.',
            'type.in'                => 'O tipo deve ser montante ou porquinho.',
        ];
    }
}
