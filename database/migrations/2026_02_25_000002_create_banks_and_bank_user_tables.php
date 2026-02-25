<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('bank_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('balance', 14, 2)->default(0);
            $table->unique(['bank_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_user');
        Schema::dropIfExists('banks');
    }
};
