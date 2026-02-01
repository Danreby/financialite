<?php

namespace App\Contracts\Services;

use App\Models\User;

interface AuthServiceInterface
{
    /**
     * Register a new user.
     *
     * @param array $data
     * @return User
     */
    public function register(array $data): User;

    /**
     * Attempt to authenticate a user.
     *
     * @param array $credentials
     * @param bool $remember
     * @return bool
     */
    public function authenticate(array $credentials, bool $remember = false): bool;

    /**
     * Logout the current user.
     *
     * @return void
     */
    public function logout(): void;

    /**
     * Check if credentials are valid without logging in.
     *
     * @param array $credentials
     * @return bool
     */
    public function validateCredentials(array $credentials): bool;
}
