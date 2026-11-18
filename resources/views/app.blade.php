<!DOCTYPE html>
@php
    $colorMode = auth()->user()?->color_mode;
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

        <!-- Modo claro/escuro antes do CSS pintar: servidor > cache local > sistema -->
        <script @isset($cspNonce) nonce="{{ $cspNonce }}" @endisset>
            (function () {
                var saved = @json($colorMode);
                try { saved = saved || localStorage.getItem('theme'); } catch (e) {}
                var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', dark);
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
