<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('notify:users')
    ->dailyAt('12:00')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('incomes:credit-to-bank')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('parcelas:sync')
    ->twiceDaily(0, 12)
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command('budget:check-threshold')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();
