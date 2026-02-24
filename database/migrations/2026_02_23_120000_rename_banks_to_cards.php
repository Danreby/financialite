<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('banks', 'cards');

        Schema::table('bank_user', function (Blueprint $table) {
            $table->dropForeign(['bank_id']);
        });

        Schema::rename('bank_user', 'card_user');

        Schema::table('card_user', function (Blueprint $table) {
            $table->renameColumn('bank_id', 'card_id');
        });

        Schema::table('card_user', function (Blueprint $table) {
            $table->foreign('card_id')->references('id')->on('cards')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('card_user', function (Blueprint $table) {
            $table->dropForeign(['card_id']);
        });

        Schema::table('card_user', function (Blueprint $table) {
            $table->renameColumn('card_id', 'bank_id');
        });

        Schema::rename('card_user', 'bank_user');

        Schema::table('bank_user', function (Blueprint $table) {
            $table->foreign('bank_id')->references('id')->on('banks')->onDelete('cascade');
        });

        Schema::rename('cards', 'banks');
    }
};
