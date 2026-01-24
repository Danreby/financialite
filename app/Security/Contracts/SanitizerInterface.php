<?php

namespace App\Security\Contracts;

interface SanitizerInterface
{
    public function sanitize(mixed $value): mixed;

    public function sanitizeArray(array $data, array $except = []): array;

    public function sanitizeString(string $value): string;
}
