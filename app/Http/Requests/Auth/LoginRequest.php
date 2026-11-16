<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\LoginThrottle;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um e-mail válido.',
            'email.max' => 'O e-mail não pode ter mais de :max caracteres.',
            'password.required' => 'A senha é obrigatória.',
            'password.max' => 'A senha não pode ter mais de :max caracteres.',
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            $this->throttle()->hit();

            $user = User::where('email', strtolower(trim($this->input('email'))))->first();

            if ($user && ! $user->hasPasswordSet() && $user->hasGoogleLinked()) {
                throw ValidationException::withMessages([
                    'email' => 'google_only_account',
                ]);
            }

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $this->throttle()->clear();
    }

    public function ensureIsNotRateLimited(): void
    {
        $throttle = $this->throttle();

        if (! $throttle->tooManyAttempts()) {
            return;
        }

        event(new Lockout($this));

        $seconds = $throttle->availableIn();

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    private function throttle(): LoginThrottle
    {
        return LoginThrottle::for($this);
    }
}
