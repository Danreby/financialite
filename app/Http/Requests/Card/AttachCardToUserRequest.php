<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;

class AttachCardToUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'card_id' => 'required|exists:cards,id',
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ];
    }
}
