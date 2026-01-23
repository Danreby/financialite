<?php

namespace App\Services;

use App\Models\BankUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Security\Contracts\SanitizerInterface;
use DomainException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service for importing faturas/transactions with security validations.
 */
class FaturaImportService
{
    /**
     * Maximum rows allowed per import to prevent abuse.
     */
    private const MAX_IMPORT_ROWS = 500;

    public function __construct(
        private FaturaService $writer,
        private SanitizerInterface $sanitizer
    ) {
    }

    /**
     * Import rows of fatura data for a user.
     *
     * @param Authenticatable $user
     * @param array $rows
     * @return int Number of imported records
     * @throws DomainException
     */
    public function importRows(Authenticatable $user, array $rows): int
    {
        // Security: Limit import size to prevent DoS attacks
        if (count($rows) > self::MAX_IMPORT_ROWS) {
            throw new DomainException(
                'O número máximo de registros por importação é ' . self::MAX_IMPORT_ROWS . '.'
            );
        }

        // Security: Log import attempt
        Log::channel('security')->info('Import attempt', [
            'user_id' => $user->id,
            'row_count' => count($rows),
            'ip' => request()->ip(),
        ]);

        return DB::transaction(function () use ($user, $rows) {
            $importedCount = 0;

            foreach ($rows as $index => $row) {
                // Security: Sanitize all string inputs
                $sanitizedRow = $this->sanitizeRow($row);
                
                // Security: Validate row structure
                $this->validateRowStructure($sanitizedRow, $index);

                $bankUserId = $this->resolveBankUserIdByName($user->id, $sanitizedRow['bank_user_name'] ?? null, $index);
                $categoryId = $this->resolveCategoryIdByName($user->id, $sanitizedRow['category_name'] ?? null, $index);

                $data = [
                    'title' => $sanitizedRow['title'],
                    'description' => $sanitizedRow['description'] ?? null,
                    'amount' => $this->sanitizeAmount($sanitizedRow['amount'], $index),
                    'type' => $this->validateType($sanitizedRow['type'], $index),
                    'status' => $this->validateStatus($sanitizedRow['status'] ?? 'unpaid', $index),
                    'total_installments' => $this->sanitizeInstallment($sanitizedRow['total_installments'] ?? null),
                    'current_installment' => $this->sanitizeInstallment($sanitizedRow['current_installment'] ?? null),
                    'is_recurring' => filter_var($sanitizedRow['is_recurring'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'bank_user_id' => $bankUserId,
                    'category_id' => $categoryId,
                ];

                $this->writer->createForUser($user, $data);
                $importedCount++;
            }

            // Security: Log successful import
            Log::channel('security')->info('Import successful', [
                'user_id' => $user->id,
                'imported_count' => $importedCount,
            ]);

            return $importedCount;
        });
    }

    /**
     * Sanitize all string values in a row.
     *
     * @param array $row
     * @return array
     */
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

    /**
     * Validate row has required fields.
     *
     * @param array $row
     * @param int $index
     * @throws DomainException
     */
    private function validateRowStructure(array $row, int $index): void
    {
        $required = ['title', 'amount', 'type'];
        
        foreach ($required as $field) {
            if (!isset($row[$field]) || $row[$field] === '') {
                throw new DomainException(
                    "Campo obrigatório '{$field}' não encontrado na linha " . ($index + 2) . '.'
                );
            }
        }
    }

    /**
     * Sanitize and validate amount.
     *
     * @param mixed $amount
     * @param int $index
     * @return float
     * @throws DomainException
     */
    private function sanitizeAmount(mixed $amount, int $index): float
    {
        $sanitized = filter_var($amount, FILTER_VALIDATE_FLOAT);
        
        if ($sanitized === false || $sanitized < 0) {
            throw new DomainException(
                'Valor inválido na linha ' . ($index + 2) . '. O valor deve ser um número positivo.'
            );
        }

        // Security: Limit maximum amount to prevent abuse
        if ($sanitized > 999999999.99) {
            throw new DomainException(
                'Valor muito alto na linha ' . ($index + 2) . '. O valor máximo permitido é 999.999.999,99.'
            );
        }

        return round($sanitized, 2);
    }

    /**
     * Validate type against allowed values.
     *
     * @param string $type
     * @param int $index
     * @return string
     * @throws DomainException
     */
    private function validateType(string $type, int $index): string
    {
        $type = strtolower(trim($type));
        
        if (!in_array($type, Transacao::VALID_TYPES, true)) {
            throw new DomainException(
                'Tipo inválido na linha ' . ($index + 2) . ': ' . $type . 
                '. Tipos válidos: ' . implode(', ', Transacao::VALID_TYPES)
            );
        }

        return $type;
    }

    /**
     * Validate status against allowed values.
     *
     * @param string $status
     * @param int $index
     * @return string
     * @throws DomainException
     */
    private function validateStatus(string $status, int $index): string
    {
        $status = strtolower(trim($status));
        
        if (!in_array($status, Transacao::VALID_STATUSES, true)) {
            throw new DomainException(
                'Status inválido na linha ' . ($index + 2) . ': ' . $status . 
                '. Status válidos: ' . implode(', ', Transacao::VALID_STATUSES)
            );
        }

        return $status;
    }

    /**
     * Sanitize installment number.
     *
     * @param mixed $value
     * @return int|null
     */
    private function sanitizeInstallment(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $sanitized = filter_var($value, FILTER_VALIDATE_INT);
        
        if ($sanitized === false || $sanitized < 1) {
            return null;
        }

        // Security: Reasonable limit for installments
        return min($sanitized, 120);
    }

    /**
     * Resolve bank user ID by bank name.
     *
     * @param int $userId
     * @param string|null $bankUserName
     * @param int $index
     * @return int|null
     * @throws DomainException
     */
    private function resolveBankUserIdByName(int $userId, ?string $bankUserName, int $index): ?int
    {
        if (!$bankUserName) {
            return null;
        }

        $bankUser = BankUser::with('bank')
            ->forUser($userId)
            ->whereHas('bank', function ($q) use ($bankUserName) {
                $q->where('name', $bankUserName);
            })
            ->first();

        if (!$bankUser) {
            throw new DomainException(
                'Conta não encontrada para o nome informado na linha ' . ($index + 2) . ': ' . $bankUserName
            );
        }

        return $bankUser->id;
    }

    /**
     * Resolve category ID by name.
     *
     * @param int $userId
     * @param string|null $categoryName
     * @param int $index
     * @return int|null
     * @throws DomainException
     */
    private function resolveCategoryIdByName(int $userId, ?string $categoryName, int $index): ?int
    {
        if (!$categoryName) {
            return null;
        }

        $category = Category::forUser($userId)
            ->where('name', $categoryName)
            ->first();

        if (!$category) {
            throw new DomainException(
                'Categoria não encontrada para o nome informado na linha ' . ($index + 2) . ': ' . $categoryName
            );
        }

        return $category->id;
    }
}
