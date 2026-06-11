<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('card_user', 'bank_id') && ! Schema::hasColumn('card_user', 'card_id')) {
            Schema::table('card_user', function (Blueprint $table) {
                $table->renameColumn('bank_id', 'card_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('card_user', 'card_id') && ! Schema::hasColumn('card_user', 'bank_id')) {
            Schema::table('card_user', function (Blueprint $table) {
                $table->renameColumn('card_id', 'bank_id');
            });
        }
    }
};
