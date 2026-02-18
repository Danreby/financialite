<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            
            $table->decimal('monthly_limit', 12, 2);
            
            $table->string('month_year', 7);
            
            $table->boolean('is_active')->default(true);
            
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            
            $table->timestamps();
            
            $table->index(['user_id', 'month_year']);
            $table->index(['user_id', 'is_active']);
            
            $table->unique(['user_id', 'month_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
