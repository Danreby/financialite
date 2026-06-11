<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);

            $table->enum('recurrence_type', ['none', 'monthly', 'yearly'])
                ->default('monthly');

            $table->unsignedTinyInteger('due_day');

            $table->date('start_date');

            $table->date('end_date')
                ->nullable();

            $table->string('color', 7)->default('#3b82f6');
            $table->string('icon', 50)->default('FileText');

            $table->enum('status', ['active', 'inactive', 'completed'])
                ->default('active');

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'due_day']);
            $table->index('start_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
