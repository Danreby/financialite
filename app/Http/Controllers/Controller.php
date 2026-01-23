<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    protected function normalizeInsertData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = mb_strtolower($value, 'UTF-8');
            }
        }

        return $data;
    }

    protected function unauthorized(string $message = 'Não autorizado.'): JsonResponse
    {
        return response()->json(['message' => $message], 403);
    }

    protected function notFound(string $message = 'Recurso não encontrado.'): JsonResponse
    {
        return response()->json(['message' => $message], 404);
    }

    protected function success(mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json($data, $status);
    }

    protected function error(string $message, int $status = 400): JsonResponse
    {
        return response()->json(['message' => $message], $status);
    }

    protected function serverError(string $message = 'Erro interno do servidor.'): JsonResponse
    {
        return response()->json(['message' => $message], 500);
    }
}

