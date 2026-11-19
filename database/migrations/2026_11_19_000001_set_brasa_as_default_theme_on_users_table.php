<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * A paleta padrão passa a ser "brasa" (laranja da direção nova). Só muda o
 * valor padrão da coluna para quem for criado daqui em diante; a paleta já
 * salva de cada usuário continua como está.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme', 30)->default('brasa')->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme', 30)->default('rose')->change();
        });
    }
};
