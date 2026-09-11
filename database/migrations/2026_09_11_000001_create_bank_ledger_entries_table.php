<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_ledger_entries', function (Blueprint $table) {
            $table->id();
            // No DB-level foreign keys: some shared-hosting MySQL accounts don't
            // grant the REFERENCES privilege needed for FK constraints. Referential
            // integrity here is enforced by the application (BankLedgerService is
            // the only writer), not by the database.
            $table->foreignId('user_id');
            $table->foreignId('bank_user_id');
            $table->string('type');
            $table->decimal('amount', 14, 2);
            $table->decimal('balance_after', 14, 2);
            $table->nullableMorphs('source');
            $table->string('description')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['bank_user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_ledger_entries');
    }
};
