<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Nomes dos cartões de catálogo criados por CardsSeeder e MoreCardsSeeder.
     * Não há marcador no banco que distinga catálogo de cartão personalizado,
     * então o backfill usa essa lista para não tomar um cartão de catálogo por
     * cartão de um único usuário.
     */
    private const CATALOG_NAMES = [
        'Nubank', 'Inter', 'C6 Bank', 'Banco do Brasil', 'Bradesco', 'Itaú', 'Santander', 'PayPal', 'PicPay',
        'Mercado Pago', 'Caixa Econômica Federal', 'PagSeguro', 'Neon', 'Next', 'BTG Pactual', 'Sicredi', 'Sicoob',
        'Banco Safra', 'Agibank', 'Banrisul', 'Banco PAN', 'Banco Original', 'Banco Daycoval', 'Banco BMG',
        'Banco Modal', 'Banco BS2', 'Banco BV', 'Banco de Brasília', 'Banco do Nordeste', 'Citibank Brasil',
        'XP Investimentos', 'Credicard', 'Hipercard', 'Elo', 'Visa', 'Mastercard', 'American Express', 'Riachuelo',
        'Carrefour', 'Americanas', 'Casas Bahia', 'Magazine Luiza', 'Renner', 'C&A', 'Pernambucanas', 'Marisa',
        'Havan', 'Submarino', 'Ponto Frio', 'Ame Digital', 'Alelo', 'Sodexo', 'Ticket', 'Porto Seguro Cartões',
        'Unicred', "Player's Bank",
    ];

    public function up(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
        });

        $catalog = array_map('mb_strtolower', self::CATALOG_NAMES);

        // Cartão fora do catálogo com vínculo em exatamente um usuário vira cartão desse usuário.
        $owners = DB::table('card_user')
            ->select('card_id', DB::raw('MIN(user_id) as owner_id'))
            ->groupBy('card_id')
            ->havingRaw('COUNT(DISTINCT user_id) = 1')
            ->get();

        foreach ($owners as $row) {
            $card = DB::table('cards')->where('id', $row->card_id)->first(['id', 'name']);

            if (! $card || in_array(mb_strtolower((string) $card->name), $catalog, true)) {
                continue;
            }

            DB::table('cards')->where('id', $card->id)->update(['user_id' => $row->owner_id]);
        }
    }

    public function down(): void
    {
        Schema::table('cards', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
