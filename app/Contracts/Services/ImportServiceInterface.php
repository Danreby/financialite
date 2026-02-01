<?php

namespace App\Contracts\Services;

use Illuminate\Contracts\Auth\Authenticatable;

interface ImportServiceInterface
{
    public function importRows(
        Authenticatable $user,
        array $rows,
        ?callable $onProgress = null
    ): ImportResult;

    public function validateRows(array $rows): array;
}

class ImportResult
{
    public function __construct(
        public readonly int $imported,
        public readonly int $skipped,
        public readonly array $errors = [],
        public readonly bool $success = true
    ) {}

    public static function success(int $imported, int $skipped = 0): self
    {
        return new self($imported, $skipped, [], true);
    }

    public static function failed(array $errors): self
    {
        return new self(0, 0, $errors, false);
    }

    public static function partial(int $imported, int $skipped, array $errors): self
    {
        return new self($imported, $skipped, $errors, count($errors) === 0);
    }
}
