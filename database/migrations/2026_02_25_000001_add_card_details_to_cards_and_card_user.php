<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->string('brand', 50)->nullable()->after('name');
            $table->string('description', 500)->nullable()->after('brand');
        });

        Schema::table('card_user', function (Blueprint $table) {
            $table->unsignedTinyInteger('closing_day')->nullable()->after('due_day');
            $table->decimal('credit_limit', 14, 2)->nullable()->after('closing_day');
        });
    }

    public function down(): void
    {
        Schema::table('card_user', function (Blueprint $table) {
            $table->dropColumn(['closing_day', 'credit_limit']);
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn(['brand', 'description']);
        });
    }
};
