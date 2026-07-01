<?php

namespace App\Contracts\Services;

use Illuminate\Contracts\Auth\Authenticatable;

interface PrevisaoMensalServiceInterface
{
    public function buildPrevisaoMensal(Authenticatable $user, array $filters = []): array;
}
