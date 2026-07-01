<?php

namespace App\Providers;

use App\Contracts\Services\AnexoServiceInterface;
use App\Contracts\Services\AuthServiceInterface;
use App\Contracts\Services\BankAccountServiceInterface;
use App\Contracts\Services\BankTransferServiceInterface;
use App\Contracts\Services\BillingServiceInterface;
use App\Contracts\Services\DashboardServiceInterface;
use App\Contracts\Services\ExportServiceInterface;
use App\Contracts\Services\ExtratoServiceInterface;
use App\Contracts\Services\FaturaServiceInterface;
use App\Contracts\Services\ImportServiceInterface;
use App\Contracts\Services\IncomeServiceInterface;
use App\Contracts\Services\NotificationServiceInterface;
use App\Contracts\Services\PaymentServiceInterface;
use App\Contracts\Services\PrevisaoMensalServiceInterface;
use App\Contracts\Services\ResumoMensalServiceInterface;
use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Services\AnexoService;
use App\Services\Auth\AuthService;
use App\Services\BankAccountService;
use App\Services\BankTransferService;
use App\Services\ExtratoService;
use App\Services\FaturaBillingService;
use App\Services\FaturaDashboardService;
use App\Services\FaturaExportService;
use App\Services\FaturaImportService;
use App\Services\FaturaPaymentService;
use App\Services\FaturaService;
use App\Services\IncomeService;
use App\Services\NotificationService;
use App\Services\PrevisaoMensalService;
use App\Services\ResumoMensalService;
use App\Services\SavingsGoalService;
use Illuminate\Support\ServiceProvider;

class ServiceBindingProvider extends ServiceProvider
{
    public array $bindings = [
        FaturaServiceInterface::class => FaturaService::class,
        AnexoServiceInterface::class => AnexoService::class,
        NotificationServiceInterface::class => NotificationService::class,
        BillingServiceInterface::class => FaturaBillingService::class,
        PaymentServiceInterface::class => FaturaPaymentService::class,
        ExportServiceInterface::class => FaturaExportService::class,
        ImportServiceInterface::class => FaturaImportService::class,
        DashboardServiceInterface::class => FaturaDashboardService::class,
        AuthServiceInterface::class => AuthService::class,
        IncomeServiceInterface::class => IncomeService::class,
        ExtratoServiceInterface::class => ExtratoService::class,
        SavingsGoalServiceInterface::class => SavingsGoalService::class,
        BankAccountServiceInterface::class => BankAccountService::class,
        BankTransferServiceInterface::class => BankTransferService::class,
        ResumoMensalServiceInterface::class => ResumoMensalService::class,
        PrevisaoMensalServiceInterface::class => PrevisaoMensalService::class,
    ];

    public function register(): void {}

    public function boot(): void {}
}
