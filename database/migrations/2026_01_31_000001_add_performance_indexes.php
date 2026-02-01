<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transacoes', function (Blueprint $table) {
            if (!$this->hasIndex('transacoes', 'transacoes_user_id_index')) {
                $table->index('user_id', 'transacoes_user_id_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_status_index')) {
                $table->index('status', 'transacoes_status_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_type_index')) {
                $table->index('type', 'transacoes_type_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_paid_date_index')) {
                $table->index('paid_date', 'transacoes_paid_date_index');
            }

            if (!$this->hasIndex('transacoes', 'transacoes_user_status_created_index')) {
                $table->index(['user_id', 'status', 'created_at'], 'transacoes_user_status_created_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_user_type_index')) {
                $table->index(['user_id', 'type'], 'transacoes_user_type_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_user_bankuser_index')) {
                $table->index(['user_id', 'bank_user_id'], 'transacoes_user_bankuser_index');
            }
            if (!$this->hasIndex('transacoes', 'transacoes_user_category_index')) {
                $table->index(['user_id', 'category_id'], 'transacoes_user_category_index');
            }
        });

        Schema::table('faturas', function (Blueprint $table) {
            if (!$this->hasIndex('faturas', 'faturas_month_key_index')) {
                $table->index('month_key', 'faturas_month_key_index');
            }
            if (!$this->hasIndex('faturas', 'faturas_paid_at_index')) {
                $table->index('paid_at', 'faturas_paid_at_index');
            }
            if (!$this->hasIndex('faturas', 'faturas_user_month_index')) {
                $table->index(['user_id', 'month_key'], 'faturas_user_month_index');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            if (!$this->hasIndex('notifications', 'notifications_type_index')) {
                $table->index('type', 'notifications_type_index');
            }
            if (!$this->hasIndex('notifications', 'notifications_user_read_created_index')) {
                $table->index(['user_id', 'is_read', 'created_at'], 'notifications_user_read_created_index');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (!$this->hasIndex('categories', 'categories_name_index')) {
                $table->index('name', 'categories_name_index');
            }
            if (!$this->hasIndex('categories', 'categories_user_name_index')) {
                $table->index(['user_id', 'name'], 'categories_user_name_index');
            }
        });

        Schema::table('bank_user', function (Blueprint $table) {
            if (!$this->hasIndex('bank_user', 'bank_user_user_id_index')) {
                $table->index('user_id', 'bank_user_user_id_index');
            }
        });

        Schema::table('anexos', function (Blueprint $table) {
            if (!$this->hasIndex('anexos', 'anexos_type_index')) {
                $table->index('type', 'anexos_type_index');
            }
        });

        Schema::table('password_reset_tokens', function (Blueprint $table) {
            if (!$this->hasIndex('password_reset_tokens', 'password_reset_tokens_created_at_index')) {
                $table->index('created_at', 'password_reset_tokens_created_at_index');
            }
        });
    }

    public function down(): void
    {
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

        Schema::table('faturas', function (Blueprint $table) {
            $table->dropIndex('faturas_month_key_index');
            $table->dropIndex('faturas_paid_at_index');
            $table->dropIndex('faturas_user_month_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_type_index');
            $table->dropIndex('notifications_user_read_created_index');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_name_index');
            $table->dropIndex('categories_user_name_index');
        });

        Schema::table('bank_user', function (Blueprint $table) {
            $table->dropIndex('bank_user_user_id_index');
        });

        Schema::table('anexos', function (Blueprint $table) {
            $table->dropIndex('anexos_type_index');
        });

        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropIndex('password_reset_tokens_created_at_index');
        });
    }

    protected function hasIndex(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $schemaManager = $connection->getDoctrineSchemaManager();
        
        try {
            $indexes = $schemaManager->listTableIndexes($table);
            return array_key_exists($index, $indexes);
        } catch (\Exception $e) {
            return false;
        }
    }
};
