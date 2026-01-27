<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Anexo extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'anexos';

    protected $fillable = [
        'user_id',
        'original_name',
        'stored_name',
        'mime_type',
        'extension',
        'size',
        'disk',
        'path',
        'hash',
        'description',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    /**
     * Tipos MIME permitidos para upload
     */
    public const ALLOWED_MIME_TYPES = [
        // Imagens
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Documentos
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Planilhas
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        // Texto
        'text/plain',
    ];

    /**
     * Extensões permitidas para upload
     */
    public const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        'pdf', 'doc', 'docx',
        'xls', 'xlsx', 'csv',
        'txt',
    ];

    /**
     * Tamanho máximo do arquivo em bytes (10MB)
     */
    public const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**
     * Relacionamento: Anexo pertence a um usuário
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacionamento: Anexo pode estar associado a múltiplas transações
     */
    public function transacoes(): BelongsToMany
    {
        return $this->belongsToMany(Transacao::class, 'anexo_transacao')
            ->withTimestamps();
    }

    /**
     * Scope: Filtrar anexos por usuário
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filtrar por tipo MIME
     */
    public function scopeOfType(Builder $query, string $mimeType): Builder
    {
        return $query->where('mime_type', 'like', $mimeType . '%');
    }

    /**
     * Scope: Apenas imagens
     */
    public function scopeImages(Builder $query): Builder
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    /**
     * Scope: Apenas documentos
     */
    public function scopeDocuments(Builder $query): Builder
    {
        return $query->whereIn('mime_type', [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    /**
     * Scope: Apenas planilhas
     */
    public function scopeSpreadsheets(Builder $query): Builder
    {
        return $query->whereIn('mime_type', [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ]);
    }

    /**
     * Accessor: URL completa para download do anexo
     */
    public function getUrlAttribute(): ?string
    {
        return route('anexos.download', $this->id);
    }

    /**
     * Accessor: Caminho completo no storage
     */
    public function getFullPathAttribute(): string
    {
        return $this->path . '/' . $this->stored_name;
    }

    /**
     * Accessor: Verifica se o arquivo existe no disco
     */
    public function getExistsAttribute(): bool
    {
        return Storage::disk($this->disk)->exists($this->full_path);
    }

    /**
     * Accessor: Tamanho formatado (KB, MB, etc)
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;

        while ($bytes >= 1024 && $index < count($units) - 1) {
            $bytes /= 1024;
            $index++;
        }

        return round($bytes, 2) . ' ' . $units[$index];
    }

    /**
     * Accessor: Verifica se é uma imagem
     */
    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Accessor: Verifica se é um PDF
     */
    public function getIsPdfAttribute(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Accessor: Verifica se é uma planilha
     */
    public function getIsSpreadsheetAttribute(): bool
    {
        return in_array($this->mime_type, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ]);
    }

    /**
     * Accessor: Ícone baseado no tipo do arquivo
     */
    public function getIconTypeAttribute(): string
    {
        if ($this->is_image) {
            return 'image';
        }

        if ($this->is_pdf) {
            return 'pdf';
        }

        if ($this->is_spreadsheet) {
            return 'spreadsheet';
        }

        if (in_array($this->mime_type, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])) {
            return 'document';
        }

        return 'file';
    }

    /**
     * Obtém o conteúdo do arquivo
     */
    public function getContent(): ?string
    {
        if (!$this->exists) {
            return null;
        }

        return Storage::disk($this->disk)->get($this->full_path);
    }

    /**
     * Obtém o stream do arquivo para download
     */
    public function getStream()
    {
        if (!$this->exists) {
            return null;
        }

        return Storage::disk($this->disk)->readStream($this->full_path);
    }

    /**
     * Deleta o arquivo físico do disco
     */
    public function deleteFile(): bool
    {
        if ($this->exists) {
            return Storage::disk($this->disk)->delete($this->full_path);
        }

        return true;
    }

    /**
     * Boot do model para deletar arquivo ao excluir registro
     */
    protected static function booted(): void
    {
        static::forceDeleting(function (Anexo $anexo) {
            $anexo->deleteFile();
        });
    }
}
