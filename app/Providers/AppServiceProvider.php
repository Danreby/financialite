<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $locale = config('app.locale', 'pt_BR');

        app()->setLocale($locale);
        Carbon::setLocale($locale);

        setlocale(LC_TIME, $locale . '.utf8', $locale . '.UTF-8', $locale);
    }
}
