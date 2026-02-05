<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();

            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);

            $table->enum('type', ['salary', 'freelance', 'investment', 'rental', 'benefit', 'other'])
                ->default('salary');

            $table->enum('payment_day_type', ['fixed', 'business_day'])
                ->default('fixed')
                ->comment('fixed = dia fixo do mês, business_day = Nº dia útil do mês');

            $table->unsignedTinyInteger('payment_day_value')
                ->default(1)
                ->comment('Dia fixo (1-31) ou Nº do dia útil (1-25)');

            $table->boolean('is_active')->default(true);

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('bank_user_id')
                ->nullable()
                ->constrained('bank_user')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
