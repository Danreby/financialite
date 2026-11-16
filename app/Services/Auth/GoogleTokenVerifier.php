<?php

namespace App\Services\Auth;

use Google\Client as GoogleClient;

class GoogleTokenVerifier
{
    /**
     * Valida o id_token no Google e confere o client_id (aud).
     * Retorna o payload ou null se o token for inválido.
     */
    public function verify(string $idToken): ?array
    {
        try {
            $clientId = config('services.google.client_id');
            $payload = (new GoogleClient(['client_id' => $clientId]))->verifyIdToken($idToken);

            if (! $payload || ($payload['aud'] ?? '') !== $clientId) {
                return null;
            }

            return $payload;
        } catch (\Exception $e) {
            report($e);

            return null;
        }
    }
}
