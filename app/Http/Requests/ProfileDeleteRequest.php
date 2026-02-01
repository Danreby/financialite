<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProfileDeleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'current_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.required' => 'A senha é obrigatória para excluir sua conta.',
            'password.current_password' => 'A senha informada está incorreta.',
        ];
    }

    public function attributes(): array
    {
        return [
            'password' => 'senha',
        ];
    }
}
