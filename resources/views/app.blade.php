<!DOCTYPE html>
@php
    $colorMode = auth()->user()?->color_mode;
    // Sem escolha salva o padrão é o escuro; 'system' é decidido pelo script abaixo.
    $serverDark = ! in_array($colorMode, ['light', 'system'], true);
    $userPalette = auth()->user()?->theme;
    // Mesma fonte do ThemeContext (lida uma vez, em cache); só as cores entram na página.
    $palettes = \App\Support\Palettes::colors();
@endphp
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => $serverDark])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="color-scheme" content="light dark">
        <meta name="theme-color" content="{{ $serverDark ? '#0B0B0C' : '#F4F4F5' }}">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

        <title inertia>{{ config('app.name', 'Financialite') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Modo e paleta antes do CSS pintar: servidor > cache local > padrão (escuro, brasa) -->
        <script @isset($cspNonce) nonce="{{ $cspNonce }}" @endisset>
            (function () {
                var root = document.documentElement;
                var palettes = @json($palettes);
                var mode = @json($colorMode);
                var key = @json($userPalette);
                try {
                    mode = mode || localStorage.getItem('theme');
                    key = key || localStorage.getItem('app-theme');
                } catch (e) {}
                var dark = mode === 'system'
                    ? !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
                    : mode !== 'light';
                root.classList.toggle('dark', dark);

                var palette = palettes[key] || palettes.brasa;
                var c = palette[dark ? 'dark' : 'light'];
                var ch = function (hex) {
                    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }).join(' ');
                };
                root.style.setProperty('--accent', ch(c.accent));
                root.style.setProperty('--accent-hover', ch(c.accentHover));
                root.style.setProperty('--accent-soft', ch(c.accentSoft));
                root.style.setProperty('--accent-text', ch(c.accentText));
                root.style.setProperty('--accent-ring', ch(dark ? c.accentText : c.accent));
                root.style.setProperty('--chart-1', ch(c.chart || (dark ? c.accentText : c.accent)));
                var meta = document.querySelector('meta[name="theme-color"]');
                if (meta) meta.setAttribute('content', dark ? '#0B0B0C' : '#F4F4F5');
            })();
        </script>

        <!-- Scripts -->
        @routes(null, $cspNonce ?? null)
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-surface-base text-content-primary">
        @inertia
    </body>
</html>
