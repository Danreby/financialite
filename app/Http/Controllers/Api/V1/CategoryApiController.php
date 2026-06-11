<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\CategoryStoreRequest;
use App\Http\Requests\Category\CategoryUpdateRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    public function store(CategoryStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());
        $data['user_id'] = $user->id;

        try {
            $category = Category::create($data);

            return $this->success($category, 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar categoria.');
        }
    }

    public function update(CategoryUpdateRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);
        $data = $this->normalizeInsertData($request->validated());

        try {
            $category->update($data);

            return $this->success($category);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar categoria.');
        }
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);
        $category->delete();

        return $this->success(['message' => 'Categoria removida.']);
    }
}
