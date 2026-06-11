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
        $preserveCase = ['email', 'password', 'password_confirmation'];

        foreach ($data as $key => $value) {
            if (is_string($value) && ! in_array($key, $preserveCase, true)) {
                $data[$key] = mb_strtolower(trim($value), 'UTF-8');
            }
        }

        return $data;
    }

    protected function unauthorized(string $message = 'Não autorizado.'): JsonResponse
    {
        return response()->json(['error' => $message], 403);
    }

    protected function notFound(string $message = 'Recurso não encontrado.'): JsonResponse
    {
        return response()->json(['error' => $message], 404);
    }

    protected function success(mixed $data = null, int $status = 200): JsonResponse
    {
        return response()->json($data, $status);
    }

    protected function error(string $message, int $status = 400): JsonResponse
    {
        return response()->json(['error' => $message], $status);
    }

    protected function serverError(string $message = 'Erro interno do servidor.'): JsonResponse
    {
        return response()->json(['error' => $message], 500);
    }

    protected function validationError(array $errors, string $message = 'Dados inválidos.'): JsonResponse
    {
        return response()->json([
            'error' => $message,
            'errors' => $errors,
        ], 422);
    }
}
