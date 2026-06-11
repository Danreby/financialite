<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        return Inertia::render('Config', [
            'userTheme' => $user->theme ?? 'rose',
        ]);
    }

    public function updateTheme(Request $request): JsonResponse
    {
        $user = $request->user();
        $theme = $request->input('theme');

        $validThemes = ['rose', 'black', 'forest', 'gold', 'lavender', 'midnight'];

        if (! in_array($theme, $validThemes, true)) {
            return response()->json(['error' => 'Tema inválido.'], 422);
        }

        $user->update(['theme' => $theme]);

        return response()->json(['theme' => $theme]);
    }

    public function about(): InertiaResponse
    {
        return Inertia::render('About');
    }
}
