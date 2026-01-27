<?php

namespace App\Http\Controllers;

use App\Http\Requests\Anexo\AnexoAttachRequest;
use App\Http\Requests\Anexo\AnexoStoreRequest;
use App\Http\Requests\Anexo\AnexoUpdateRequest;
use App\Models\Anexo;
use App\Services\AnexoService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use DomainException;

class AnexoController extends Controller
{
    public function __construct(
        private AnexoService $anexoService,
        private NotificationService $notifications
    ) {
        $this->middleware('auth');
    }

    /**
     * Lista todos os anexos do usuário
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Anexo::class);

        $user = $request->user();

        $filters = [
            'type' => $request->input('type'),
            'search' => $request->input('search'),
            'per_page' => $request->input('per_page', 20),
        ];

        $anexos = $this->anexoService->listForUser($user->id, $filters);

        return $this->success($anexos);
    }

    /**
     * Lista anexos de uma transação específica
     */
    public function listForTransacao(Request $request, int $transacaoId): JsonResponse
    {
        $this->authorize('viewAny', Anexo::class);

        $user = $request->user();

        try {
            $anexos = $this->anexoService->listForTransacao($transacaoId, $user->id);

            return $this->success([
                'data' => $anexos->map(function ($anexo) {
                    return [
                        'id' => $anexo->id,
                        'original_name' => $anexo->original_name,
                        'mime_type' => $anexo->mime_type,
                        'extension' => $anexo->extension,
                        'size' => $anexo->size,
                        'formatted_size' => $anexo->formatted_size,
                        'description' => $anexo->description,
                        'is_image' => $anexo->is_image,
                        'is_pdf' => $anexo->is_pdf,
                        'is_spreadsheet' => $anexo->is_spreadsheet,
                        'icon_type' => $anexo->icon_type,
                        'url' => $anexo->url,
                        'created_at' => $anexo->created_at,
                    ];
                }),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Transação não encontrada.');
        }
    }

    /**
     * Upload de arquivo único
     */
    public function store(AnexoStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Anexo::class);

        $user = $request->user();
        $validated = $request->validated();

        try {
            // Upload múltiplo
            if ($request->hasFile('files')) {
                $anexos = $this->anexoService->uploadMultiple(
                    $user,
                    $request->file('files'),
                    $validated['transacao_id'] ?? null
                );

                return $this->success([
                    'message' => count($anexos) . ' arquivo(s) enviado(s) com sucesso.',
                    'data' => array_map(fn($anexo) => $this->formatAnexoResponse($anexo), $anexos),
                ], 201);
            }

            // Upload único
            $anexo = $this->anexoService->upload(
                $user,
                $request->file('file'),
                $validated['transacao_id'] ?? null,
                $validated['description'] ?? null
            );

            return $this->success([
                'message' => 'Arquivo enviado com sucesso.',
                'data' => $this->formatAnexoResponse($anexo),
            ], 201);
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->notifications->error($user, 'Erro no upload', 'Ocorreu um erro ao enviar o arquivo.');

            return $this->serverError(config('app.debug') ? $e->getMessage() : 'Erro ao enviar arquivo.');
        }
    }

    /**
     * Exibe informações de um anexo
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        try {
            $anexo = $this->anexoService->getForUser($id, $user->id);
            $this->authorize('view', $anexo);

            return $this->success([
                'data' => $this->formatAnexoResponse($anexo),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Anexo não encontrado.');
        }
    }

    /**
     * Download de um anexo
     */
    public function download(Request $request, int $id): StreamedResponse|JsonResponse
    {
        $user = $request->user();

        try {
            $anexo = $this->anexoService->getForUser($id, $user->id);
            $this->authorize('download', $anexo);

            return $this->anexoService->download($anexo);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Anexo não encontrado.');
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * Visualização inline de um anexo (imagens e PDFs)
     */
    public function preview(Request $request, int $id): StreamedResponse|JsonResponse
    {
        $user = $request->user();

        try {
            $anexo = $this->anexoService->getForUser($id, $user->id);
            $this->authorize('view', $anexo);

            // Permite preview apenas para imagens e PDFs
            if (!$anexo->is_image && !$anexo->is_pdf) {
                return $this->error('Preview disponível apenas para imagens e PDFs.', 400);
            }

            return $this->anexoService->inline($anexo);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Anexo não encontrado.');
        } catch (\RuntimeException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * Atualiza descrição de um anexo
     */
    public function update(AnexoUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        try {
            $anexo = $this->anexoService->getForUser($id, $user->id);
            $this->authorize('update', $anexo);

            $anexo = $this->anexoService->updateDescription($anexo, $validated['description'] ?? null);

            return $this->success([
                'message' => 'Anexo atualizado com sucesso.',
                'data' => $this->formatAnexoResponse($anexo),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Anexo não encontrado.');
        }
    }

    /**
     * Remove um anexo (soft delete)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        try {
            $anexo = $this->anexoService->getForUser($id, $user->id);
            $this->authorize('delete', $anexo);

            $this->anexoService->delete($anexo);

            return $this->success(['message' => 'Anexo removido com sucesso.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Anexo não encontrado.');
        } catch (\Throwable $e) {
            $this->notifications->error($user, 'Erro ao remover anexo', 'Ocorreu um erro ao remover o anexo.');

            return $this->serverError('Erro ao remover anexo.');
        }
    }

    /**
     * Associa um anexo existente a uma transação
     */
    public function attach(AnexoAttachRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        try {
            $anexo = $this->anexoService->getForUser($validated['anexo_id'], $user->id);
            $this->authorize('attach', $anexo);

            $this->anexoService->attachToTransacao($anexo, $validated['transacao_id'], $user->id);

            return $this->success([
                'message' => 'Anexo associado à transação com sucesso.',
            ]);
        } catch (DomainException $e) {
            return $this->unauthorized($e->getMessage());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Recurso não encontrado.');
        }
    }

    /**
     * Remove associação de um anexo com uma transação
     */
    public function detach(Request $request, int $anexoId, int $transacaoId): JsonResponse
    {
        $user = $request->user();

        try {
            $anexo = $this->anexoService->getForUser($anexoId, $user->id);
            $this->authorize('detach', $anexo);

            $this->anexoService->detachFromTransacao($anexo, $transacaoId, $user->id);

            return $this->success([
                'message' => 'Anexo desassociado da transação com sucesso.',
            ]);
        } catch (DomainException $e) {
            return $this->unauthorized($e->getMessage());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Recurso não encontrado.');
        }
    }

    /**
     * Retorna estatísticas de uso de anexos do usuário
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Anexo::class);

        $user = $request->user();

        $totalSpace = $this->anexoService->getTotalSpaceUsed($user->id);
        $totalCount = $this->anexoService->getTotalCount($user->id);

        // Formata o espaço usado
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        $bytes = $totalSpace;

        while ($bytes >= 1024 && $index < count($units) - 1) {
            $bytes /= 1024;
            $index++;
        }

        return $this->success([
            'total_files' => $totalCount,
            'total_space_bytes' => $totalSpace,
            'total_space_formatted' => round($bytes, 2) . ' ' . $units[$index],
        ]);
    }

    /**
     * Formata resposta de anexo para JSON
     */
    private function formatAnexoResponse($anexo): array
    {
        return [
            'id' => $anexo->id,
            'original_name' => $anexo->original_name,
            'mime_type' => $anexo->mime_type,
            'extension' => $anexo->extension,
            'size' => $anexo->size,
            'formatted_size' => $anexo->formatted_size,
            'description' => $anexo->description,
            'is_image' => $anexo->is_image,
            'is_pdf' => $anexo->is_pdf,
            'is_spreadsheet' => $anexo->is_spreadsheet,
            'icon_type' => $anexo->icon_type,
            'url' => $anexo->url,
            'preview_url' => $anexo->is_image || $anexo->is_pdf ? route('anexos.preview', $anexo->id) : null,
            'created_at' => $anexo->created_at,
            'updated_at' => $anexo->updated_at,
        ];
    }
}
