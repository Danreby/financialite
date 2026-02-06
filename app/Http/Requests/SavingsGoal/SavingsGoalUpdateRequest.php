<?php

namespace App\Http\Requests\SavingsGoal;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;

class SavingsGoalUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title'          => ['sometimes', 'string', 'min:2', 'max:255', new SafeString(255)],
            'description'    => ['nullable', 'string', 'max:1000'],
            'target_amount'  => ['sometimes', 'numeric', 'min:0.01', 'max:99999999.99'],
            'icon'           => ['nullable', 'string', 'max:10'],
            'color'          => ['nullable', 'string', 'max:20'],
            'is_active'      => ['nullable', 'boolean'],
        ];
    }
}
