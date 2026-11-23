<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Cores das paletas para o primeiro paint (resources/views/app.blade.php).
 *
 * A fonte é a mesma do ThemeContext (resources/js/Constants/palettes.json).
 * O arquivo é lido uma vez e guardado em cache com a data de modificação na
 * chave, então editar o JSON invalida o cache sozinho. Se o arquivo sumir ou
 * vier quebrado, a página ainda pinta com a Brasa.
 */
class Palettes
{
    /** Cópia da Brasa em palettes.json, usada só quando o arquivo falha. */
    public const FALLBACK = [
        'brasa' => [
            'light' => [
                'accent' => '#C2410C',
                'accentHover' => '#9A3412',
                'accentSoft' => '#FAF4F0',
                'accentText' => '#C2410C',
                'chart' => '#F2541B',
            ],
            'dark' => [
                'accent' => '#D2430E',
                'accentHover' => '#B83A0B',
                'accentSoft' => '#2E2926',
                'accentText' => '#FF6B35',
                'chart' => '#F2541B',
            ],
        ],
    ];

    public static function path(): string
    {
        return resource_path('js/Constants/palettes.json');
    }

    /**
     * Paletas como ['chave' => ['light' => [...], 'dark' => [...]]].
     *
     * @return array<string, array{light: array<string, string>, dark: array<string, string>}>
     */
    public static function colors(?string $path = null): array
    {
        $path ??= static::path();
        $modified = @filemtime($path);

        if ($modified === false) {
            return self::FALLBACK;
        }

        return Cache::rememberForever(
            'palettes:'.md5($path).':'.$modified,
            fn () => static::read($path)
        );
    }

    private static function read(string $path): array
    {
        $decoded = json_decode((string) @file_get_contents($path), true);

        $palettes = collect(is_array($decoded) ? $decoded : [])
            ->filter(fn ($p) => is_array($p) && is_array($p['light'] ?? null) && is_array($p['dark'] ?? null))
            ->map(fn ($p) => ['light' => $p['light'], 'dark' => $p['dark']])
            ->all();

        // Sem a Brasa o script de primeiro paint não tem para onde cair.
        return isset($palettes['brasa']) ? $palettes : $palettes + self::FALLBACK;
    }
}
