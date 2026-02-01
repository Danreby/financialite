<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Contracts\Services\FaturaServiceInterface;
use App\Contracts\Services\AnexoServiceInterface;
use App\Contracts\Services\NotificationServiceInterface;
use App\Contracts\Services\BillingServiceInterface;
use App\Contracts\Services\PaymentServiceInterface;
use App\Contracts\Services\ExportServiceInterface;
use App\Contracts\Services\ImportServiceInterface;
use App\Contracts\Services\DashboardServiceInterface;
use App\Contracts\Services\AuthServiceInterface;

use App\Services\FaturaService;
use App\Services\AnexoService;
use App\Services\NotificationService;
use App\Services\FaturaBillingService;
use App\Services\FaturaPaymentService;
use App\Services\FaturaExportService;
use App\Services\FaturaImportService;
use App\Services\FaturaDashboardService;
use App\Services\Auth\AuthService;

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
    ];

    public function register(): void
    {
    }

    public function boot(): void
    {
    }
}
