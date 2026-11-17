<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_payments', function (Blueprint $table) {
            $table->foreignId('transacao_id')
                ->nullable()
                ->after('bill_id')
                ->constrained('transacoes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bill_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transacao_id');
        });
    }
};
