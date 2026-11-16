<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Localiza, vincula ou cria o usuário a partir de um payload do Google
 * já validado. Usado pelo login web e pela API.
 */
class GoogleAccountLinker
{
    public function resolve(array $payload): User
    {
        $googleId = $payload['sub'];
        $email = strtolower(trim($payload['email']));
        $avatar = $payload['picture'] ?? null;

        $user = User::where('google_id', $googleId)->first();

        if ($user) {
            if ($avatar && $avatar !== $user->avatar) {
                $user->update(['avatar' => $avatar]);
            }
        } elseif ($user = User::where('email', $email)->first()) {
            $this->linkExisting($user, $googleId, $avatar);
        } else {
            $user = User::create([
                'name' => $payload['name'] ?? 'Usuário',
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'password' => null,
                'email_verified_at' => now(),
            ]);

            event(new Registered($user));
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $user;
    }

    private function linkExisting(User $user, string $googleId, ?string $avatar): void
    {
        // Conta cujo e-mail nunca foi confirmado pode ter sido criada por um
        // terceiro (com senha dele) antes do dono real. Ao vincular o Google,
        // derrubamos tudo que esse terceiro possa ter.
        if (! $user->hasVerifiedEmail()) {
            $user->forceFill(['password' => null, 'remember_token' => null])->save();
            $this->revokeAccess($user);
        }

        $user->update([
            'google_id' => $googleId,
            'avatar' => $avatar ?: $user->avatar,
        ]);
    }

    private function revokeAccess(User $user): void
    {
        $user->tokens()->delete();

        // Em produção as sessões ficam na tabela `sessions` (SESSION_DRIVER=database).
        if (Schema::hasTable('sessions')) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }
    }
}
