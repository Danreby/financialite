<?php

namespace App\Providers;

use App\Models\Anexo;
use App\Models\Bank;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Income;
use App\Models\Notification;
use App\Models\Transacao;
use App\Policies\AnexoPolicy;
use App\Policies\BankPolicy;
use App\Policies\BankTransferPolicy;
use App\Policies\BankUserPolicy;
use App\Policies\CardPolicy;
use App\Policies\CardUserPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\IncomePolicy;
use App\Policies\NotificationPolicy;
use App\Policies\TransacaoPolicy;
use App\Security\Contracts\SanitizerInterface;
use App\Security\Contracts\SecurityLoggerInterface;
use App\Security\Services\InputSanitizer;
use App\Security\Services\SecurityLogger;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class SecurityServiceProvider extends ServiceProvider
{
    protected array $policies = [
        Anexo::class => AnexoPolicy::class,
        Bank::class => BankPolicy::class,
        BankTransfer::class => BankTransferPolicy::class,
        BankUser::class => BankUserPolicy::class,
        Transacao::class => TransacaoPolicy::class,
        Category::class => CategoryPolicy::class,
        CardUser::class => CardUserPolicy::class,
        Income::class => IncomePolicy::class,
        Notification::class => NotificationPolicy::class,
        Card::class => CardPolicy::class,
    ];

    public function register(): void
    {
        $this->app->singleton(SanitizerInterface::class, InputSanitizer::class);
        $this->app->singleton(SecurityLoggerInterface::class, SecurityLogger::class);
    }

    public function boot(): void
    {
        $this->registerPolicies();
        $this->configureSecuritySettings();
    }

    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    protected function configureSecuritySettings(): void
    {
        if ($this->app->environment('production')) {
            config([
                'session.secure' => true,
                'session.same_site' => 'lax',
            ]);
        }
    }
}
