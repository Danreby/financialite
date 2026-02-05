<?php

namespace App\Contracts\Services;

use Illuminate\Contracts\Auth\Authenticatable;

interface ExtratoServiceInterface
{
    public function buildExtrato(Authenticatable $user, array $filters = []): array;
}
