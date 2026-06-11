<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        Notification::create([
            'user_id' => $request->user()->id,
            'title' => 'Senha alterada',
            'message' => 'Sua senha foi atualizada com sucesso.',
            'type' => 'security',
        ]);

        return back();
    }

    public function set(Request $request): RedirectResponse
    {
        if ($request->user()->hasPasswordSet()) {
            return back()->withErrors(['password' => 'Sua conta já possui uma senha. Use a opção de alterar senha.']);
        }

        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        Notification::create([
            'user_id' => $request->user()->id,
            'title' => 'Senha definida',
            'message' => 'Uma senha foi criada para sua conta com sucesso.',
            'type' => 'security',
        ]);

        return back();
    }
}
