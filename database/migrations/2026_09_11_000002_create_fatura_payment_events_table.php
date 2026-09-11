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
            $table->foreignId('fatura_id')->constrained('faturas')->cascadeOnDelete();
            $table->foreignId('transacao_id')->nullable()->constrained('transacoes')->nullOnDelete();
            $table->foreignId('bank_ledger_entry_id')->nullable()->constrained('bank_ledger_entries')->nullOnDelete();
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
