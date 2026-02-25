<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            if (!Schema::hasColumn('cards', 'brand')) {
                $table->string('brand', 50)->nullable()->after('name');
            }
            if (!Schema::hasColumn('cards', 'description')) {
                $table->string('description', 500)->nullable()->after('brand');
            }
        });

        Schema::table('card_user', function (Blueprint $table) {
            if (!Schema::hasColumn('card_user', 'closing_day')) {
                $table->unsignedTinyInteger('closing_day')->nullable()->after('due_day');
            }
            if (!Schema::hasColumn('card_user', 'credit_limit')) {
                $table->decimal('credit_limit', 14, 2)->nullable()->after('closing_day');
            }
        });
    }

    public function down(): void
    {
        Schema::table('card_user', function (Blueprint $table) {
            $table->dropColumn(array_filter(['closing_day', 'credit_limit'], fn($col) => Schema::hasColumn('card_user', $col)));
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn(array_filter(['brand', 'description'], fn($col) => Schema::hasColumn('cards', $col)));
        });
    }
};
