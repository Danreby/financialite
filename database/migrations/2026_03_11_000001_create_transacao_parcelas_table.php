<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transacao_parcelas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transacao_id')
                ->constrained('transacoes')
                ->cascadeOnDelete();
            $table->unsignedInteger('installment_number');
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->date('paid_date')->nullable();
            $table->timestamps();

            $table->unique(['transacao_id', 'installment_number']);
            $table->index(['transacao_id', 'due_date']);
            $table->index(['transacao_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transacao_parcelas');
    }
};
