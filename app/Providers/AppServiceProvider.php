<?php

namespace App\Providers;

use App\Mail\MailtrapTransport;
use App\Models\Transacao;
use App\Observers\TransacaoObserver;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $locale = config('app.locale', 'pt_BR');

        app()->setLocale($locale);
        Carbon::setLocale($locale);

        setlocale(LC_TIME, $locale . '.utf8', $locale . '.UTF-8', $locale);

        Mail::extend('mailtrap', function (array $config = []) {
            return new MailtrapTransport(
                apiKey: config('services.mailtrap.api_key')
            );
        });

        Transacao::observe(TransacaoObserver::class);
    }
}
