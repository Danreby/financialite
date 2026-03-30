<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_user_id_name_unique');
        });

        Schema::table('banks', function (Blueprint $table) {
            $table->dropUnique('banks_name_unique');
            $table->index('name', 'banks_name_index');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unique(['user_id', 'name'], 'categories_user_id_name_unique');
        });

        Schema::table('banks', function (Blueprint $table) {
            $table->dropIndex('banks_name_index');
            $table->unique('name', 'banks_name_unique');
        });
    }
};
