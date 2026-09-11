<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fatura_payment_events', function (Blueprint $table) {
            $table->id();
            // No DB-level foreign keys: some shared-hosting MySQL accounts don't
            // grant the REFERENCES privilege needed for FK constraints. Referential
            // integrity here is enforced by the application (FaturaLedgerService is
            // the only writer), not by the database.
            $table->foreignId('fatura_id');
            $table->foreignId('transacao_id')->nullable();
            $table->foreignId('bank_ledger_entry_id')->nullable();
            $table->string('type');
            $table->decimal('amount', 14, 2);
            $table->string('description')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('fatura_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fatura_payment_events');
    }
};
