<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Schema::table('transacoes', function (Blueprint $table) {
                $table->index('user_id', 'transacoes_user_id_index');
                $table->index('status', 'transacoes_status_index');
                $table->index('type', 'transacoes_type_index');
                $table->index('paid_date', 'transacoes_paid_date_index');
                $table->index(['user_id', 'status', 'created_at'], 'transacoes_user_status_created_index');
                $table->index(['user_id', 'type'], 'transacoes_user_type_index');
                $table->index(['user_id', 'bank_user_id'], 'transacoes_user_bankuser_index');
                $table->index(['user_id', 'category_id'], 'transacoes_user_category_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('faturas', function (Blueprint $table) {
                $table->index('month_key', 'faturas_month_key_index');
                $table->index('paid_at', 'faturas_paid_at_index');
                $table->index(['user_id', 'month_key'], 'faturas_user_month_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index('type', 'notifications_type_index');
                $table->index(['user_id', 'is_read', 'created_at'], 'notifications_user_read_created_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('categories', function (Blueprint $table) {
                $table->index('name', 'categories_name_index');
                $table->index(['user_id', 'name'], 'categories_user_name_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('bank_user', function (Blueprint $table) {
                $table->index('user_id', 'bank_user_user_id_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                $table->index('created_at', 'password_reset_tokens_created_at_index');
            });
        } catch (\Exception $e) {
        }
    }

    public function down(): void
    {
        try {
            Schema::table('transacoes', function (Blueprint $table) {
                $table->dropIndex('transacoes_user_id_index');
                $table->dropIndex('transacoes_status_index');
                $table->dropIndex('transacoes_type_index');
                $table->dropIndex('transacoes_paid_date_index');
                $table->dropIndex('transacoes_user_status_created_index');
                $table->dropIndex('transacoes_user_type_index');
                $table->dropIndex('transacoes_user_bankuser_index');
                $table->dropIndex('transacoes_user_category_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('faturas', function (Blueprint $table) {
                $table->dropIndex('faturas_month_key_index');
                $table->dropIndex('faturas_paid_at_index');
                $table->dropIndex('faturas_user_month_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('notifications_type_index');
                $table->dropIndex('notifications_user_read_created_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropIndex('categories_name_index');
                $table->dropIndex('categories_user_name_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('bank_user', function (Blueprint $table) {
                $table->dropIndex('bank_user_user_id_index');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('password_reset_tokens', function (Blueprint $table) {
                $table->dropIndex('password_reset_tokens_created_at_index');
            });
        } catch (\Exception $e) {
        }
    }
};
