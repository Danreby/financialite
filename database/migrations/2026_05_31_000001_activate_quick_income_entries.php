<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Previously, QuickIncomeForm saved one-time (is_recurring=false) entries with
 * is_active=false to prevent them from appearing in recurring income totals.
 * The logic has been updated: one-time entries are now stored with is_active=true
 * so they can appear in monthly summaries. This migration activates all existing
 * one-time entries so they are visible in historical data.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('incomes')
            ->where('is_recurring', false)
            ->where('is_active', false)
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);
    }

    public function down(): void
    {
        // Not reversible without knowing original state.
    }
};
