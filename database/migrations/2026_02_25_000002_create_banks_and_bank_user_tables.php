<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('banks')) {
            Schema::create('banks', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->softDeletes();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('bank_user')) {
            Schema::create('bank_user', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('bank_id');
                $table->unsignedBigInteger('user_id');
                $table->decimal('balance', 14, 2)->default(0);
                $table->unique(['bank_id', 'user_id'], 'bu_bank_id_user_id_uniq');
                $table->timestamps();

                $table->foreign('bank_id', 'bu_bank_id_fk')->references('id')->on('banks')->cascadeOnDelete();
                $table->foreign('user_id', 'bu_user_id_fk')->references('id')->on('users')->cascadeOnDelete();
            });
        } else {
            if (!Schema::hasColumn('bank_user', 'balance')) {
                Schema::table('bank_user', function (Blueprint $table) {
                    $table->decimal('balance', 14, 2)->default(0)->after('user_id');
                });
            }

            $dbName  = DB::getDatabaseName();
            $hasUniq = DB::table('information_schema.TABLE_CONSTRAINTS')
                ->where('CONSTRAINT_SCHEMA', $dbName)
                ->where('TABLE_NAME', 'bank_user')
                ->where('CONSTRAINT_TYPE', 'UNIQUE')
                ->whereIn('CONSTRAINT_NAME', ['bank_user_bank_id_user_id_unique', 'bank_user_unique'])
                ->exists();

            if (!$hasUniq) {
                Schema::table('bank_user', function (Blueprint $table) {
                    $table->unique(['bank_id', 'user_id'], 'bank_user_bank_id_user_id_unique');
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_user');
        Schema::dropIfExists('banks');
    }
};
