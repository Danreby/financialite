<?php

namespace App\Contracts\Services;

use Illuminate\Contracts\Auth\Authenticatable;

interface ResumoMensalServiceInterface
{
    public function buildResumoMensal(Authenticatable $user, array $filters = []): array;
}
