<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('faturas', function (Blueprint $table) {
            if (Schema::hasColumn('faturas', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('faturas', function (Blueprint $table) {
            // Recreate the column as nullable in case of rollback
            if (!Schema::hasColumn('faturas', 'due_date')) {
                $table->date('due_date')->nullable();
            }
        });
    }
};
