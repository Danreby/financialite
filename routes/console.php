<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bills:check-upcoming')->dailyAt('14:05');

Schedule::command('invoices:check-due-date')->dailyAt('14:05');

Schedule::command('cards:check-closing-day')->dailyAt('14:05');

Schedule::command('budget:check-threshold')->dailyAt('14:05');

Schedule::command('incomes:credit-to-bank')->dailyAt('14:05');
