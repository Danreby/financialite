<?php

namespace App\Providers;

use App\Models\Bank;
use App\Models\BankUser;
use App\Models\Category;
use App\Models\Notification;
use App\Models\Transacao;
use App\Policies\BankPolicy;
use App\Policies\BankUserPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\TransacaoPolicy;
use App\Security\Contracts\SanitizerInterface;
use App\Security\Contracts\SecurityLoggerInterface;
use App\Security\Services\InputSanitizer;
use App\Security\Services\SecurityLogger;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Security Service Provider.
 * 
 * Registers security services, policies, and configurations.
 */
class SecurityServiceProvider extends ServiceProvider
{
    /**
     * Policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected array $policies = [
        Transacao::class => TransacaoPolicy::class,
        Category::class => CategoryPolicy::class,
        BankUser::class => BankUserPolicy::class,
        Notification::class => NotificationPolicy::class,
        Bank::class => BankPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register sanitizer as singleton
        $this->app->singleton(SanitizerInterface::class, InputSanitizer::class);
        
        // Register security logger as singleton
        $this->app->singleton(SecurityLoggerInterface::class, SecurityLogger::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->configureSecuritySettings();
    }

    /**
     * Register the application's policies.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    /**
     * Configure additional security settings.
     */
    protected function configureSecuritySettings(): void
    {
        // Ensure cookies are secure in production
        if ($this->app->environment('production')) {
            config([
                'session.secure' => true,
                'session.same_site' => 'lax',
            ]);
        }
    }
}
