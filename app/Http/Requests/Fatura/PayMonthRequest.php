<?php

namespace App\Http\Requests\Fatura;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayMonthRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'month' => 'required|date_format:Y-m',
            'bank_user_id' => [
                'nullable',
                Rule::exists('card_user', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
        ];
    }
}
