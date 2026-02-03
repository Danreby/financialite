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

    public const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
    ];

    public const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        'pdf',
    ];

    public const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transacoes(): BelongsToMany
    {
        return $this->belongsToMany(Transacao::class, 'anexo_transacao')
            ->withTimestamps();
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType(Builder $query, string $mimeType): Builder
    {
        return $query->where('mime_type', 'like', $mimeType . '%');
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    public function scopeDocuments(Builder $query): Builder
    {
        return $query->whereIn('mime_type', [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    public function scopeSpreadsheets(Builder $query): Builder
    {
        return $query->whereIn('mime_type', [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ]);
    }

    public function getUrlAttribute(): ?string
    {
        return route('anexos.download', $this->id);
    }

    public function getFullPathAttribute(): string
    {
        return $this->path . '/' . $this->stored_name;
    }

    public function getExistsAttribute(): bool
    {
        return Storage::disk($this->disk)->exists($this->full_path);
    }

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

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function getIsPdfAttribute(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    public function getIsSpreadsheetAttribute(): bool
    {
        return in_array($this->mime_type, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ]);
    }

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

    public function getContent(): ?string
    {
        if (!$this->exists) {
            return null;
        }

        return Storage::disk($this->disk)->get($this->full_path);
    }

    public function getStream()
    {
        if (!$this->exists) {
            return null;
        }

        return Storage::disk($this->disk)->readStream($this->full_path);
    }

    public function deleteFile(): bool
    {
        if ($this->exists) {
            return Storage::disk($this->disk)->delete($this->full_path);
        }

        return true;
    }

    protected static function booted(): void
    {
        static::forceDeleting(function (Anexo $anexo) {
            $anexo->deleteFile();
        });
    }
}
