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
        ];
    }
}
