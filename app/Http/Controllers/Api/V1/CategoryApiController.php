<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Category\CreateCategory;
use App\Actions\Category\DeleteCategory;
use App\Actions\Category\UpdateCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\CategoryStoreRequest;
use App\Http\Requests\Category\CategoryUpdateRequest;
use App\Models\Category;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::forUser($request->user()->id)
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    public function store(CategoryStoreRequest $request, CreateCategory $createCategory): JsonResponse
    {
        try {
            return $this->success($createCategory->handle($request->user(), $request->validated()), 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar categoria.');
        }
    }

    public function update(CategoryUpdateRequest $request, int $category, UpdateCategory $updateCategory): JsonResponse
    {
        try {
            return $this->success($updateCategory->handle($request->user(), $category, $request->validated()));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar categoria.');
        }
    }

    public function destroy(Request $request, int $category, DeleteCategory $deleteCategory): JsonResponse
    {
        $deleteCategory->handle($request->user(), $category);

        return $this->success(['message' => 'Categoria removida.']);
    }
}
