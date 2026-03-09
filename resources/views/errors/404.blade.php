<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Página não encontrada · {{ config('app.name', 'Financialite') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css'])

    <script>
        (function () {
            try {
                var stored = window.localStorage.getItem('theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>

    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0px);   }
            50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
            0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.35); }
            70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(244, 63, 94, 0);  }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0);     }
        }
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-float      { animation: float 4s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite; }
        .animate-fade-up    { animation: fade-up 0.55s ease-out both; }
        .delay-100 { animation-delay: 0.10s; }
        .delay-200 { animation-delay: 0.20s; }
        .delay-300 { animation-delay: 0.30s; }
        .delay-400 { animation-delay: 0.40s; }
        .delay-500 { animation-delay: 0.50s; }
    </style>
</head>
<body class="h-full font-sans antialiased bg-gray-50 text-gray-900 dark:bg-[#070707] dark:text-gray-100 overflow-x-hidden">

    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute -left-40 -top-32 h-[480px] w-[480px] rounded-full bg-rose-600/10 blur-3xl dark:bg-rose-900/20"></div>
        <div class="absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-600/8 blur-3xl dark:bg-indigo-900/15"></div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-rose-500/5 blur-[80px] dark:bg-rose-800/10"></div>
    </div>

    <main class="min-h-screen flex flex-col items-center justify-center px-4 py-16">

        <div class="w-full max-w-lg animate-fade-up">
            <div class="relative overflow-hidden rounded-3xl bg-white/90 shadow-2xl shadow-gray-300/40 ring-1 ring-black/5 backdrop-blur-sm dark:bg-[#0b0b0b] dark:shadow-black/60 dark:ring-white/5">

                <div class="h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500"></div>

                <div class="px-6 py-12 sm:px-10 sm:py-14 flex flex-col items-center text-center gap-6">

                    <div class="animate-fade-up delay-100">
                        <div class="relative inline-flex animate-pulse-ring rounded-2xl">
                            <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-pink-500 shadow-lg shadow-rose-500/30 animate-float">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div class="animate-fade-up delay-200 select-none">
                        <p class="text-[5rem] sm:text-[6.5rem] font-bold leading-none tracking-tight bg-gradient-to-br from-rose-500 via-pink-400 to-indigo-500 bg-clip-text text-transparent">
                            404
                        </p>
                    </div>

                    <div class="animate-fade-up delay-300 space-y-2 max-w-sm">
                        <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                            Página não encontrada
                        </h1>
                        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                            A rota que você tentou acessar não existe, foi removida ou está temporariamente indisponível.
                        </p>
                    </div>

                    <div class="animate-fade-up delay-400 w-full">
                        <div class="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>
                    </div>

                    <div class="animate-fade-up delay-500 flex w-full flex-col gap-3">
                        @auth
                            <a
                                href="{{ route('dashboard') }}"
                                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b0b0b] active:scale-[0.98]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                </svg>
                                Ir para o dashboard
                            </a>
                        @else
                            <a
                                href="{{ route('login') }}"
                                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:from-rose-500 hover:to-pink-500 hover:shadow-rose-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b0b0b] active:scale-[0.98]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                Ir para o login
                            </a>
                        @endauth

                        @if(url()->previous() && url()->previous() !== url()->current())
                            <a
                                href="{{ url()->previous() }}"
                                class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-700 dark:bg-[#111] dark:text-gray-300 dark:hover:bg-[#161616] active:scale-[0.98]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                                </svg>
                                Voltar para a página anterior
                            </a>
                        @endif
                    </div>

                </div>

                <div class="border-t border-gray-100 bg-gray-50/80 px-6 py-3 text-center dark:border-gray-800 dark:bg-[#0d0d0d]">
                    <p class="text-xs text-gray-400 dark:text-gray-600">
                        © {{ date('Y') }} {{ config('app.name', 'Financialite') }} &middot; Código de erro 404
                    </p>
                </div>

            </div>
        </div>

    </main>

</body>
</html>

