<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('bills:check-upcoming')->dailyAt('12:00');

Schedule::command('invoices:check-due-date')->dailyAt('12:00');

Schedule::command('cards:check-closing-day')->dailyAt('12:00');

Schedule::command('budget:check-threshold')->dailyAt('12:00');

Schedule::command('incomes:credit-to-bank')->dailyAt('12:00');
