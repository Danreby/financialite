<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bills:check-upcoming')->dailyAt('09:00');

Schedule::command('invoices:check-due-date')->dailyAt('09:00');

Schedule::command('cards:check-closing-day')->dailyAt('09:00');

// Credit recurring incomes to linked bank accounts on the configured payment day
// Runs at 00:05 so balances are updated at the very start of the payment day
Schedule::command('incomes:credit-to-bank')->dailyAt('00:05');
