<?php

namespace App\Contracts\Services;

use App\Models\Anexo;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

interface AnexoServiceInterface
{
    public function upload(
        Authenticatable $user,
        UploadedFile $file,
        ?int $transacaoId = null,
        ?string $description = null
    ): Anexo;

    public function download(Anexo $anexo): StreamedResponse;

    public function delete(Anexo $anexo): bool;

    public function update(Anexo $anexo, array $data): Anexo;

    public function attachToTransacao(Anexo $anexo, int $transacaoId): bool;

    public function detachFromTransacao(Anexo $anexo, int $transacaoId): bool;
}
