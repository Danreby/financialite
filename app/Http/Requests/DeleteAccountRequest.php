<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Confirmação de exclusão de conta. Quem tem senha confirma com ela; contas só
 * Google (sem senha) confirmam digitando o próprio e-mail.
 */
class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        if ($this->user()?->hasPasswordSet()) {
            return [
                'password' => ['required', 'current_password'],
            ];
        }

        return [
            'email' => [
                'required',
                'string',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (strtolower(trim((string) $value)) !== strtolower((string) $this->user()->email)) {
                        $fail('O e-mail digitado não confere com o da sua conta.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Digite seu e-mail para confirmar.',
        ];
    }
}
