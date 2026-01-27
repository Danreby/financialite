<?php

namespace App\Http\Controllers;

use App\Http\Requests\Anexo\AnexoAttachRequest;
use App\Http\Requests\Anexo\AnexoStoreRequest;
use App\Http\Requests\Anexo\AnexoUpdateRequest;
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
        $user = $request->user();

        $filters = [
            'type' => $request->input('type'),
            'search' => $request->input('search'),
            'per_page' => $request->input('per_page', 20),
        ];

        $anexos = $this->anexoService->listForUser($user->id, $filters);

        return response()->json($anexos);
    }

    /**
     * Lista anexos de uma transação específica
     */
    public function listForTransacao(Request $request, int $transacaoId): JsonResponse
    {
        $user = $request->user();

        try {
            $anexos = $this->anexoService->listForTransacao($transacaoId, $user->id);

            return response()->json([
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
            return response()->json(['message' => 'Transação não encontrada.'], 404);
        }
    }

    /**
     * Upload de arquivo único
     */
    public function store(AnexoStoreRequest $request): JsonResponse
    {
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

                return response()->json([
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

            return response()->json([
                'message' => 'Arquivo enviado com sucesso.',
                'data' => $this->formatAnexoResponse($anexo),
            ], 201);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            $this->notifications->error($user, 'Erro no upload', 'Ocorreu um erro ao enviar o arquivo.');

            return response()->json([
                'message' => 'Erro ao enviar arquivo.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
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

            return response()->json([
                'data' => $this->formatAnexoResponse($anexo),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
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

            return $this->anexoService->download($anexo);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
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

            // Permite preview apenas para imagens e PDFs
            if (!$anexo->is_image && !$anexo->is_pdf) {
                return response()->json([
                    'message' => 'Preview disponível apenas para imagens e PDFs.',
                ], 400);
            }

            return $this->anexoService->inline($anexo);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
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
            $anexo = $this->anexoService->updateDescription($anexo, $validated['description'] ?? null);

            return response()->json([
                'message' => 'Anexo atualizado com sucesso.',
                'data' => $this->formatAnexoResponse($anexo),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
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
            $this->anexoService->delete($anexo);

            return response()->json(['message' => 'Anexo removido com sucesso.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Anexo não encontrado.'], 404);
        } catch (\Throwable $e) {
            $this->notifications->error($user, 'Erro ao remover anexo', 'Ocorreu um erro ao remover o anexo.');

            return response()->json([
                'message' => 'Erro ao remover anexo.',
            ], 500);
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
            $this->anexoService->attachToTransacao($anexo, $validated['transacao_id'], $user->id);

            return response()->json([
                'message' => 'Anexo associado à transação com sucesso.',
            ]);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
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
            $this->anexoService->detachFromTransacao($anexo, $transacaoId, $user->id);

            return response()->json([
                'message' => 'Anexo desassociado da transação com sucesso.',
            ]);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Recurso não encontrado.'], 404);
        }
    }

    /**
     * Retorna estatísticas de uso de anexos do usuário
     */
    public function stats(Request $request): JsonResponse
    {
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

        return response()->json([
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
