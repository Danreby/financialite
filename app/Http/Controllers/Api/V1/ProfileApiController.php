<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class ProfileApiController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'theme' => $user->theme,
            'is_verified' => $user->hasVerifiedEmail(),
            'created_at' => $user->created_at,
        ]);
    }

    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'phone' => $data['phone'] ?? $user->phone,
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'theme' => $user->theme,
            'is_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    public function updateTheme(Request $request): JsonResponse
    {
        $request->validate([
            'theme' => 'required|string|in:rose,black,forest,gold,lavender,midnight',
        ]);

        $user = $request->user();
        $user->update(['theme' => $request->theme]);

        return $this->success(['theme' => $user->theme]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = $request->user();
        $user->update(['password' => Hash::make($request->password)]);

        return $this->success(['message' => 'Senha atualizada com sucesso.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|current_password',
        ]);

        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return $this->success(['message' => 'Conta excluída com sucesso.']);
    }
}
