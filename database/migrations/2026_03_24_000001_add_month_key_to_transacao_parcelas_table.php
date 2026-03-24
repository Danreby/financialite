<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transacao_parcelas', function (Blueprint $table) {
            $table->string('month_key', 7)->nullable()->after('due_date');
            $table->index('month_key');
        });
    }

    public function down(): void
    {
        Schema::table('transacao_parcelas', function (Blueprint $table) {
            $table->dropIndex(['month_key']);
            $table->dropColumn('month_key');
        });
    }
};
