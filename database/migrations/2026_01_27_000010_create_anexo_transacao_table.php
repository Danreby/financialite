<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('anexo_transacao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('anexo_id')->constrained('anexos')->onDelete('cascade');
            $table->foreignId('transacao_id')->constrained('transacoes')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['anexo_id', 'transacao_id']);
            $table->index('transacao_id');
            $table->index('anexo_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anexo_transacao');
    }
};
