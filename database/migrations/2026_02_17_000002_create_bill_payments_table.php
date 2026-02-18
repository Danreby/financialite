<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_payments', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('bill_id')
                ->constrained('bills')
                ->cascadeOnDelete();
            
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->nullable();
            
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])
                ->default('pending');
            
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->index(['bill_id', 'due_date']);
            $table->index(['bill_id', 'status']);
            $table->index('due_date');
            
            $table->unique(['bill_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_payments');
    }
};
