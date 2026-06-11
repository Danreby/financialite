<?php

namespace App\Contracts\Services;

use App\Models\User;

interface AuthServiceInterface
{
    /**
     * Register a new user.
     */
    public function register(array $data): User;

    /**
     * Attempt to authenticate a user.
     */
    public function authenticate(array $credentials, bool $remember = false): bool;

    /**
     * Logout the current user.
     */
    public function logout(): void;

    /**
     * Check if credentials are valid without logging in.
     */
    public function validateCredentials(array $credentials): bool;
}
