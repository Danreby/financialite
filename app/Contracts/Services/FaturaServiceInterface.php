<?php

namespace App\Contracts\Services;

use App\Models\Transacao;
use Illuminate\Contracts\Auth\Authenticatable;

interface FaturaServiceInterface
{
    /**
     * Create a new transaction for the authenticated user.
     *
     * @param Authenticatable $user
     * @param array $data
     * @return Transacao
     */
    public function createForUser(Authenticatable $user, array $data): Transacao;

    /**
     * Update an existing transaction.
     *
     * @param Transacao $fatura
     * @param array $data
     * @return Transacao
     */
    public function updateForUser(Transacao $fatura, array $data): Transacao;

    /**
     * Delete a transaction (soft delete).
     *
     * @param Transacao $fatura
     * @return bool
     */
    public function deleteForUser(Transacao $fatura): bool;
}
