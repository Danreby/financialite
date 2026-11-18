<!DOCTYPE html>
@php
    $colorMode = auth()->user()?->color_mode;
    $userPalette = auth()->user()?->theme;
    // Mesma fonte do ThemeContext; só as cores entram na página.
    $palettes = collect(json_decode(file_get_contents(resource_path('js/Constants/palettes.json')), true))
        ->map(fn ($p) => ['light' => $p['light'], 'dark' => $p['dark']]);
@endphp
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => $colorMode === 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="color-scheme" content="light dark">
        <meta name="theme-color" content="{{ $colorMode === 'dark' ? '#0B0F14' : '#F8FAFC' }}">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">

        <title inertia>{{ config('app.name', 'Financialite') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Modo e paleta antes do CSS pintar: servidor > cache local > sistema -->
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
                var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
                root.classList.toggle('dark', dark);

                var palette = palettes[key] || palettes.rose;
                var c = palette[dark ? 'dark' : 'light'];
                var ch = function (hex) {
                    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }).join(' ');
                };
                root.style.setProperty('--accent', ch(c.accent));
                root.style.setProperty('--accent-hover', ch(c.accentHover));
                root.style.setProperty('--accent-soft', ch(c.accentSoft));
                root.style.setProperty('--accent-text', ch(c.accentText));
                root.style.setProperty('--accent-ring', ch(dark ? c.accentText : c.accent));
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
