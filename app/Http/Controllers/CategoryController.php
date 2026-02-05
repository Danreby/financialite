<?php

namespace App\Http\Controllers;

use App\Http\Requests\Category\CategoryStoreRequest;
use App\Http\Requests\Category\CategoryUpdateRequest;
use App\Models\Category;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $user = $request->user();

        $categories = Category::forUser($user->id)
            ->ordered()
            ->get(['id', 'name', 'color', 'icon']);

        return $this->success($categories);
    }

    public function store(CategoryStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        $category = DB::transaction(function () use ($data, $user) {
            $category = Category::create([
                'name' => $data['name'],
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
                'user_id' => $user->id,
            ]);

            $this->notifications->info($user, 'Categoria criada', 'Uma nova categoria foi adicionada.');

            return $category;
        });

        return $this->success($category, 201);
    }

    public function update(CategoryUpdateRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        DB::transaction(function () use ($category, $data, $user) {
            $category->update([
                'name' => $data['name'],
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
            ]);

            $this->notifications->info($user, 'Categoria atualizada', 'Uma categoria foi atualizada.');
        });

        return $this->success($category);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $user = $request->user();

        DB::transaction(function () use ($category, $user) {
            $category->delete();

            $this->notifications->info($user, 'Categoria removida', 'Uma categoria foi removida.');
        });

        return $this->success(['message' => 'Categoria removida.']);
    }
}
