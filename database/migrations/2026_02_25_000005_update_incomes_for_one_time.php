<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(true)->after('is_active');
            $table->date('received_at')->nullable()->after('is_recurring');
            $table->foreignId('bank_account_id')->nullable()->after('bank_user_id')
                ->constrained('bank_user')->nullOnDelete();
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incomes MODIFY COLUMN `type` ENUM('salary','freelance','investment','rental','benefit','other','pix') NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            $table->dropForeign(['bank_account_id']);
            $table->dropColumn(['is_recurring', 'received_at', 'bank_account_id']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incomes MODIFY COLUMN `type` ENUM('salary','freelance','investment','rental','benefit','other') NOT NULL");
        }
    }
};
