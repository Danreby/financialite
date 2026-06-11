<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incomes', function (Blueprint $table) {
            if (! Schema::hasColumn('incomes', 'is_recurring')) {
                $table->boolean('is_recurring')->default(true)->after('is_active');
            }
            if (! Schema::hasColumn('incomes', 'received_at')) {
                $table->date('received_at')->nullable()->after('is_recurring');
            }
            if (! Schema::hasColumn('incomes', 'bank_account_id') && Schema::hasTable('bank_user')) {
                $table->foreignId('bank_account_id')->nullable()->after('bank_user_id')
                    ->constrained('bank_user')->nullOnDelete();
            }
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incomes MODIFY COLUMN `type` ENUM('salary','freelance','investment','rental','benefit','other','pix') NOT NULL");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE incomes MODIFY COLUMN `type` ENUM('salary','freelance','investment','rental','benefit','other') NOT NULL");
        }

        Schema::table('incomes', function (Blueprint $table) {
            $columns = array_filter(
                ['bank_account_id', 'received_at', 'is_recurring'],
                fn ($col) => Schema::hasColumn('incomes', $col)
            );

            if (! empty(array_filter(['bank_account_id'], fn ($c) => Schema::hasColumn('incomes', $c)))) {
                $table->dropForeign(['bank_account_id']);
            }

            if (! empty($columns)) {
                $table->dropColumn(array_values($columns));
            }
        });
    }
};
