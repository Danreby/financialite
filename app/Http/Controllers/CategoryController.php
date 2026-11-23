<?php

namespace App\Http\Controllers;

use App\Actions\Category\CreateCategory;
use App\Actions\Category\DeleteCategory;
use App\Actions\Category\UpdateCategory;
use App\Http\Requests\Category\CategoryStoreRequest;
use App\Http\Requests\Category\CategoryUpdateRequest;
use App\Models\Category;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CategoryController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function store(CategoryStoreRequest $request, CreateCategory $createCategory): JsonResponse
    {
        $this->authorize('create', Category::class);

        $user = $request->user();
        $category = $createCategory->handle($user, $request->validated());

        $this->notifications->info($user, 'Categoria criada', 'Uma nova categoria foi adicionada.');

        return $this->success($category, 201);
    }

    public function update(CategoryUpdateRequest $request, int $category, UpdateCategory $updateCategory): JsonResponse
    {
        $user = $request->user();

        // O formulário da web omite cor e ícone quando o usuário os limpa: ausente = remover.
        $data = $request->validated() + ['color' => null, 'icon' => null];
        $updated = $updateCategory->handle($user, $category, $data);

        $this->notifications->info($user, 'Categoria atualizada', 'Uma categoria foi atualizada.');

        return $this->success($updated);
    }

    public function destroy(Request $request, int $category, DeleteCategory $deleteCategory): JsonResponse
    {
        $user = $request->user();
        $deleteCategory->handle($user, $category);

        $this->notifications->info($user, 'Categoria removida', 'Uma categoria foi removida.');

        return $this->success(['message' => 'Categoria removida.']);
    }

    public function page(Request $request): InertiaResponse
    {
        $categories = Category::forUser($request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color', 'type']);

        return Inertia::render('Categorias', [
            'categories' => $categories,
        ]);
    }
}
