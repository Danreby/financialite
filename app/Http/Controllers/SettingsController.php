<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class SettingsController extends Controller
{
    private const VALID_THEMES = ['rose', 'black', 'forest', 'gold', 'lavender', 'midnight'];

    private const VALID_COLOR_MODES = ['light', 'dark'];

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

    /**
     * Salva a paleta (`theme`) e/ou o modo claro/escuro (`color_mode`).
     * Os dois campos são opcionais, mas a requisição precisa trazer pelo menos um.
     * `color_mode` aceita 'light', 'dark' ou null (seguir o sistema).
     */
    public function updateTheme(Request $request): JsonResponse
    {
        $user = $request->user();
        $changes = [];

        if ($request->has('theme')) {
            $theme = $request->input('theme');

            if (! in_array($theme, self::VALID_THEMES, true)) {
                return response()->json(['error' => 'Tema inválido.'], 422);
            }

            $changes['theme'] = $theme;
        }

        if ($request->exists('color_mode')) {
            $mode = $request->input('color_mode');

            if ($mode !== null && ! in_array($mode, self::VALID_COLOR_MODES, true)) {
                return response()->json(['error' => 'Modo de cor inválido.'], 422);
            }

            $changes['color_mode'] = $mode;
        }

        if ($changes === []) {
            return response()->json(['error' => 'Informe o tema ou o modo de cor.'], 422);
        }

        $user->update($changes);

        return response()->json([
            'theme' => $user->theme ?? 'rose',
            'color_mode' => $user->color_mode,
        ]);
    }

    public function about(): InertiaResponse
    {
        return Inertia::render('About');
    }
}
