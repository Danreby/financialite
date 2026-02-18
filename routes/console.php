<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Verificar contas próximas do vencimento - diariamente às 9h
Schedule::command('bills:check-upcoming')->dailyAt('09:00');

// Verificar faturas de cartão próximas do vencimento - diariamente às 9h
Schedule::command('invoices:check-due-date')->dailyAt('09:00');
