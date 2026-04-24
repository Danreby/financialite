<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'min:2', 'max:100'],
            'email'    => [
                'required',
                'string',
                'lowercase',
                'email:rfc,dns',
                'max:255',
                function ($attribute, $value, $fail) {
                    $existing = User::where('email', strtolower(trim($value)))->first();

                    if (! $existing) {
                        return;
                    }

                    if (! empty($existing->google_id)) {
                        $fail('Este email está vinculado a uma conta Google. Entre usando o botão "Entrar com Google".');
                    } else {
                        $fail('Este email já está cadastrado. Faça login ou redefina sua senha.');
                    }
                },
            ],
            'phone'    => ['nullable', 'string', 'max:20', 'regex:/^[\d\s\(\)\-\+]+$/'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'name.min'             => 'O nome deve ter pelo menos 2 caracteres.',
            'name.max'             => 'O nome não pode ter mais de 100 caracteres.',
            'name.required'        => 'O nome é obrigatório.',
            'email.required'       => 'O e-mail é obrigatório.',
            'email.email'          => 'Digite um endereço de e-mail válido.',
            'email.max'            => 'O e-mail não pode ter mais de 255 caracteres.',
            'password.required'    => 'A senha é obrigatória.',
            'password.confirmed'   => 'As senhas não conferem.',
            'phone.regex'          => 'O telefone contém caracteres inválidos.',
        ]);

        $user = User::create([
            'name'     => trim($request->name),
            'email'    => strtolower(trim($request->email)),
            'phone'    => $request->phone ? trim($request->phone) : null,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
