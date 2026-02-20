<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->decimal('amount', 12, 2)->nullable()->change();
            $table->date('start_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->decimal('amount', 12, 2)->nullable(false)->change();
            $table->date('start_date')->nullable(false)->change();
        });
    }
};
