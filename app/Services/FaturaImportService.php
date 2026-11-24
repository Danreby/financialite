<?php

namespace App\Services;

use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\CardUser;
use App\Models\Category;
use App\Security\Contracts\SanitizerInterface;
use DomainException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FaturaImportService
{
    private const MAX_IMPORT_ROWS = 500;

    private const MAX_AMOUNT = 999999999.99;

    private const MAX_INSTALLMENTS = 120;

    public function __construct(
        private FaturaService $writer,
        private SanitizerInterface $sanitizer
    ) {}

    public function importRows(Authenticatable $user, array $rows): int
    {
        if (count($rows) > self::MAX_IMPORT_ROWS) {
            throw new DomainException(
                'O número máximo de registros por importação é '.self::MAX_IMPORT_ROWS.'.'
            );
        }

        Log::channel('security')->info('Import attempt', [
            'user_id' => $user->id,
            'row_count' => count($rows),
            'ip' => request()->ip(),
        ]);

        return DB::transaction(function () use ($user, $rows) {
            $importedCount = 0;

            foreach ($rows as $index => $row) {
                $sanitizedRow = $this->sanitizeRow($row);
                $this->validateRowStructure($sanitizedRow, $index);

                $bankUserId = $this->resolveBankUserIdByName($user->id, $sanitizedRow['bank_user_name'] ?? null, $index);
                $categoryId = $this->resolveCategoryIdByName($user->id, $sanitizedRow['category_name'] ?? null, $index);

                $data = [
                    'title' => $sanitizedRow['title'],
                    'description' => $sanitizedRow['description'] ?? null,
                    'amount' => $this->sanitizeAmount($sanitizedRow['amount'], $index),
                    'type' => $this->validateType($sanitizedRow['type'], $index),
                    'status' => $this->validateStatus($sanitizedRow['status'] ?? TransacaoStatus::Unpaid->value, $index),
                    'total_installments' => $this->sanitizeInstallment($sanitizedRow['total_installments'] ?? null),
                    'current_installment' => $this->sanitizeInstallment($sanitizedRow['current_installment'] ?? null),
                    'is_recurring' => filter_var($sanitizedRow['is_recurring'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'bank_user_id' => $bankUserId,
                    'category_id' => $categoryId,
                ];

                $this->writer->createForUser($user, $data);
                $importedCount++;
            }

            Log::channel('security')->info('Import successful', [
                'user_id' => $user->id,
                'imported_count' => $importedCount,
            ]);

            return $importedCount;
        });
    }

    private function sanitizeRow(array $row): array
    {
        $sanitized = [];

        foreach ($row as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = $this->sanitizer->sanitize($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    private function validateRowStructure(array $row, int $index): void
    {
        $required = ['title', 'amount', 'type'];

        foreach ($required as $field) {
            if (! isset($row[$field]) || $row[$field] === '') {
                throw new DomainException(
                    "Campo obrigatório '{$field}' não encontrado na linha ".($index + 2).'.'
                );
            }
        }
    }

    private function sanitizeAmount(mixed $amount, int $index): float
    {
        $sanitized = filter_var($amount, FILTER_VALIDATE_FLOAT);

        if ($sanitized === false || $sanitized < 0) {
            throw new DomainException(
                'Valor inválido na linha '.($index + 2).'. O valor deve ser um número positivo.'
            );
        }

        if ($sanitized > self::MAX_AMOUNT) {
            throw new DomainException(
                'Valor muito alto na linha '.($index + 2).'. O valor máximo permitido é 999.999.999,99.'
            );
        }

        return round($sanitized, 2);
    }

    private function validateType(string $type, int $index): string
    {
        $type = strtolower(trim($type));

        if (TransacaoType::tryFrom($type) === null) {
            throw new DomainException(
                'Tipo inválido na linha '.($index + 2).': '.$type.
                '. Tipos válidos: '.implode(', ', TransacaoType::values())
            );
        }

        return $type;
    }

    private function validateStatus(string $status, int $index): string
    {
        $status = strtolower(trim($status));

        if (TransacaoStatus::tryFrom($status) === null) {
            throw new DomainException(
                'Status inválido na linha '.($index + 2).': '.$status.
                '. Status válidos: '.implode(', ', TransacaoStatus::values())
            );
        }

        return $status;
    }

    private function sanitizeInstallment(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $sanitized = filter_var($value, FILTER_VALIDATE_INT);

        if ($sanitized === false || $sanitized < 1) {
            return null;
        }

        return min($sanitized, self::MAX_INSTALLMENTS);
    }

    private function resolveBankUserIdByName(int $userId, ?string $bankUserName, int $index): ?int
    {
        if (! $bankUserName) {
            return null;
        }

        $bankUser = CardUser::with('card')
            ->forUser($userId)
            ->whereHas('card', function ($q) use ($bankUserName) {
                $q->whereRaw('LOWER(name) = ?', [mb_strtolower($bankUserName, 'UTF-8')]);
            })
            ->first();

        if (! $bankUser) {
            throw new DomainException(
                'Cartão não encontrado para o nome informado na linha '.($index + 2).': '.$bankUserName
            );
        }

        return $bankUser->id;
    }

    private function resolveCategoryIdByName(int $userId, ?string $categoryName, int $index): ?int
    {
        if (! $categoryName) {
            return null;
        }

        $category = Category::forUser($userId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($categoryName, 'UTF-8')])
            ->first();

        if (! $category) {
            throw new DomainException(
                'Categoria não encontrada para o nome informado na linha '.($index + 2).': '.$categoryName
            );
        }

        return $category->id;
    }
}
