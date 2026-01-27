<?php

namespace App\Services;

use App\Models\Anexo;
use App\Models\Transacao;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnexoService
{
    /**
     * Disco padrão para armazenamento de anexos
     */
    private const DEFAULT_DISK = 'anexos';

    /**
     * Upload de arquivo e criação do registro de anexo
     */
    public function upload(
        Authenticatable $user,
        UploadedFile $file,
        ?int $transacaoId = null,
        ?string $description = null
    ): Anexo {
        $this->validateFile($file);

        return DB::transaction(function () use ($user, $file, $transacaoId, $description) {
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            $size = $file->getSize();
            $hash = hash_file('sha256', $file->getRealPath());

            // Gera nome único para evitar colisões e ataques de traversal
            $storedName = $this->generateStoredName($extension);

            // Organiza em pastas por usuário e ano/mês
            $path = $this->generatePath($user->id);

            // Armazena o arquivo de forma segura
            $file->storeAs($path, $storedName, self::DEFAULT_DISK);

            // Cria o registro no banco de dados
            $anexo = Anexo::create([
                'user_id' => $user->id,
                'original_name' => $this->sanitizeFilename($originalName),
                'stored_name' => $storedName,
                'mime_type' => $mimeType,
                'extension' => $extension,
                'size' => $size,
                'disk' => self::DEFAULT_DISK,
                'path' => $path,
                'hash' => $hash,
                'description' => $description,
            ]);

            // Associa à transação se informada
            if ($transacaoId) {
                $this->attachToTransacao($anexo, $transacaoId, $user->id);
            }

            return $anexo;
        });
    }

    /**
     * Upload de múltiplos arquivos
     */
    public function uploadMultiple(
        Authenticatable $user,
        array $files,
        ?int $transacaoId = null
    ): array {
        $anexos = [];

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $anexos[] = $this->upload($user, $file, $transacaoId);
            }
        }

        return $anexos;
    }

    /**
     * Associa um anexo a uma transação
     */
    public function attachToTransacao(Anexo $anexo, int $transacaoId, int $userId): void
    {
        $transacao = Transacao::where('id', $transacaoId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Verifica se o anexo pertence ao mesmo usuário
        if ($anexo->user_id !== $userId) {
            throw new \DomainException('Você não tem permissão para associar este anexo.');
        }

        // Evita duplicatas
        if (!$anexo->transacoes()->where('transacao_id', $transacaoId)->exists()) {
            $anexo->transacoes()->attach($transacaoId);
        }
    }

    /**
     * Remove associação de anexo com transação
     */
    public function detachFromTransacao(Anexo $anexo, int $transacaoId, int $userId): void
    {
        $transacao = Transacao::where('id', $transacaoId)
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($anexo->user_id !== $userId) {
            throw new \DomainException('Você não tem permissão para desassociar este anexo.');
        }

        $anexo->transacoes()->detach($transacaoId);
    }

    /**
     * Lista anexos de uma transação
     */
    public function listForTransacao(int $transacaoId, int $userId): \Illuminate\Database\Eloquent\Collection
    {
        $transacao = Transacao::where('id', $transacaoId)
            ->where('user_id', $userId)
            ->firstOrFail();

        return $transacao->anexos()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Lista todos os anexos do usuário
     */
    public function listForUser(int $userId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Anexo::forUser($userId)
            ->orderBy('created_at', 'desc');

        if (!empty($filters['type'])) {
            match ($filters['type']) {
                'image' => $query->images(),
                'document' => $query->documents(),
                'spreadsheet' => $query->spreadsheets(),
                default => null,
            };
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('original_name', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Obtém um anexo verificando permissões
     */
    public function getForUser(int $anexoId, int $userId): Anexo
    {
        return Anexo::where('id', $anexoId)
            ->where('user_id', $userId)
            ->firstOrFail();
    }

    /**
     * Download de um anexo
     */
    public function download(Anexo $anexo): StreamedResponse
    {
        if (!$anexo->exists) {
            throw new \RuntimeException('Arquivo não encontrado no disco.');
        }

        $disk = Storage::disk($anexo->disk);

        return $disk->download(
            $anexo->full_path,
            $anexo->original_name,
            [
                'Content-Type' => $anexo->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $anexo->original_name . '"',
            ]
        );
    }

    /**
     * Visualização inline de um anexo (para imagens e PDFs)
     */
    public function inline(Anexo $anexo): StreamedResponse
    {
        if (!$anexo->exists) {
            throw new \RuntimeException('Arquivo não encontrado no disco.');
        }

        $disk = Storage::disk($anexo->disk);

        return $disk->response(
            $anexo->full_path,
            $anexo->original_name,
            [
                'Content-Type' => $anexo->mime_type,
                'Content-Disposition' => 'inline; filename="' . $anexo->original_name . '"',
            ]
        );
    }

    /**
     * Gera URL temporária para visualização (se o disco suportar)
     */
    public function getTemporaryUrl(Anexo $anexo, int $minutes = 5): ?string
    {
        $disk = Storage::disk($anexo->disk);

        if (method_exists($disk, 'temporaryUrl')) {
            return $disk->temporaryUrl(
                $anexo->full_path,
                now()->addMinutes($minutes)
            );
        }

        return null;
    }

    /**
     * Atualiza descrição do anexo
     */
    public function updateDescription(Anexo $anexo, ?string $description): Anexo
    {
        $anexo->update(['description' => $description]);
        return $anexo->refresh();
    }

    /**
     * Exclui um anexo (soft delete)
     */
    public function delete(Anexo $anexo): bool
    {
        return DB::transaction(function () use ($anexo) {
            // Remove todas as associações com transações
            $anexo->transacoes()->detach();

            // Soft delete do registro
            return $anexo->delete();
        });
    }

    /**
     * Exclui permanentemente um anexo (força delete e remove arquivo)
     */
    public function forceDelete(Anexo $anexo): bool
    {
        return DB::transaction(function () use ($anexo) {
            // Remove todas as associações com transações
            $anexo->transacoes()->detach();

            // Force delete irá disparar o evento que deleta o arquivo físico
            return $anexo->forceDelete();
        });
    }

    /**
     * Restaura um anexo soft-deleted
     */
    public function restore(int $anexoId, int $userId): Anexo
    {
        $anexo = Anexo::withTrashed()
            ->where('id', $anexoId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $anexo->restore();

        return $anexo;
    }

    /**
     * Verifica se existe duplicata pelo hash
     */
    public function findDuplicate(int $userId, string $hash): ?Anexo
    {
        return Anexo::forUser($userId)
            ->where('hash', $hash)
            ->first();
    }

    /**
     * Valida o arquivo antes do upload
     */
    private function validateFile(UploadedFile $file): void
    {
        // Verifica tamanho
        if ($file->getSize() > Anexo::MAX_FILE_SIZE) {
            throw new \DomainException(
                'O arquivo excede o tamanho máximo permitido de ' . 
                (Anexo::MAX_FILE_SIZE / 1024 / 1024) . 'MB.'
            );
        }

        // Verifica extensão
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, Anexo::ALLOWED_EXTENSIONS)) {
            throw new \DomainException(
                'Extensão de arquivo não permitida. Extensões aceitas: ' . 
                implode(', ', Anexo::ALLOWED_EXTENSIONS)
            );
        }

        // Verifica MIME type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, Anexo::ALLOWED_MIME_TYPES)) {
            throw new \DomainException(
                'Tipo de arquivo não permitido.'
            );
        }

        // Validação adicional para imagens
        if (str_starts_with($mimeType, 'image/') && $mimeType !== 'image/svg+xml') {
            $imageInfo = @getimagesize($file->getRealPath());
            if ($imageInfo === false) {
                throw new \DomainException('O arquivo não é uma imagem válida.');
            }
        }
    }

    /**
     * Gera nome único e seguro para armazenamento
     */
    private function generateStoredName(string $extension): string
    {
        return Str::uuid()->toString() . '.' . $extension;
    }

    /**
     * Gera caminho organizado por usuário e data
     */
    private function generatePath(int $userId): string
    {
        $year = date('Y');
        $month = date('m');

        return "users/{$userId}/{$year}/{$month}";
    }

    /**
     * Sanitiza o nome do arquivo para evitar ataques
     */
    private function sanitizeFilename(string $filename): string
    {
        // Remove caracteres perigosos
        $filename = preg_replace('/[^\w\s\.\-\(\)]/u', '', $filename);

        // Remove múltiplos espaços
        $filename = preg_replace('/\s+/', ' ', $filename);

        // Limita o tamanho
        if (strlen($filename) > 255) {
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            $name = pathinfo($filename, PATHINFO_FILENAME);
            $maxNameLength = 255 - strlen($extension) - 1;
            $filename = substr($name, 0, $maxNameLength) . '.' . $extension;
        }

        return trim($filename);
    }

    /**
     * Calcula o espaço total usado pelo usuário em bytes
     */
    public function getTotalSpaceUsed(int $userId): int
    {
        return Anexo::forUser($userId)->sum('size');
    }

    /**
     * Conta total de anexos do usuário
     */
    public function getTotalCount(int $userId): int
    {
        return Anexo::forUser($userId)->count();
    }
}
