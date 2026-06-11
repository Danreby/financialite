<?php

namespace App\Contracts\Services;

use App\Models\Transacao;
use Illuminate\Contracts\Auth\Authenticatable;

interface FaturaServiceInterface
{
    /**
     * Create a new transaction for the authenticated user.
     */
    public function createForUser(Authenticatable $user, array $data): Transacao;

    /**
     * Update an existing transaction.
     */
    public function updateForUser(Transacao $fatura, array $data): Transacao;

    /**
     * Delete a transaction (soft delete).
     */
    public function deleteForUser(Transacao $fatura): bool;
}
