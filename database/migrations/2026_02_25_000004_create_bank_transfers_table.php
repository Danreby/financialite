<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bank_transfers')) {
            Schema::create('bank_transfers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('from_bank_user_id')->constrained('bank_user')->cascadeOnDelete();
                $table->foreignId('to_bank_user_id')->constrained('bank_user')->cascadeOnDelete();
                $table->decimal('amount', 14, 2);
                $table->string('description', 500)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transfers');
    }
};
