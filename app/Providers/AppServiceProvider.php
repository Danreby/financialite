<?php

namespace App\Providers;

use App\Mail\MailtrapTransport;
use App\Models\Transacao;
use App\Observers\TransacaoObserver;
use Carbon\Carbon;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
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

        // Segmentos de id não numéricos (ex.: /notifications/abc/read) devem dar
        // 404 e não um TypeError (500) ao chegar no controller.
        foreach ([
            'id', 'anexoId', 'transacaoId', 'bankUser', 'bill', 'payment', 'budget',
            'card', 'cardUser', 'category', 'income', 'notification', 'savingsGoal',
            'card_resource', 'card_user',
        ] as $parameter) {
            Route::pattern($parameter, '[0-9]+');
        }

        $this->warnAboutInsecureProductionConfig();

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        $locale = config('app.locale', 'pt_BR');

        app()->setLocale($locale);
        Carbon::setLocale($locale);

        setlocale(LC_TIME, $locale.'.utf8', $locale.'.UTF-8', $locale);

        Mail::extend('mailtrap', function (array $config = []) {
            return new MailtrapTransport(
                apiKey: config('services.mailtrap.api_key')
            );
        });

        Transacao::observe(TransacaoObserver::class);
    }

    /**
     * Não derruba a aplicação, mas deixa um log critical se a produção estiver
     * com debug ligado ou cookies de sessão sem flag Secure.
     */
    private function warnAboutInsecureProductionConfig(): void
    {
        if (! $this->app->isProduction() || $this->app->runningInConsole()) {
            return;
        }

        if (config('app.debug') === true || config('session.secure') !== true) {
            Log::critical('Configuração insegura em produção: APP_DEBUG deve ser false e SESSION_SECURE_COOKIE deve ser true.');
        }
    }
}
