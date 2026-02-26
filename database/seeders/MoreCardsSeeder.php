<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\Card;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MoreBanksSeeder extends Seeder
{
    public function run(): void
    {
        $banks = [
            ['name' => 'Caixa Econômica Federal'],
            ['name' => 'PagSeguro'],
            ['name' => 'Neon'],
            ['name' => 'Next'],
            ['name' => 'BTG Pactual'],
            ['name' => 'Sicredi'],
            ['name' => 'Sicoob'],
            ['name' => 'Banco Safra'],
            ['name' => 'Agibank'],
            ['name' => 'Banrisul'],
            ['name' => 'Banco PAN'],
            ['name' => 'Banco Original'],
            ['name' => 'Banco Daycoval'],
            ['name' => 'Banco BMG'],
            ['name' => 'Banco Modal'],
            ['name' => 'Banco BS2'],
            ['name' => 'Banco BV'],
            ['name' => 'Banco de Brasília'],
            ['name' => 'Banco do Nordeste'],
            ['name' => 'Citibank Brasil'],
            ['name' => 'XP Investimentos'],
            ['name' => 'Credicard'],
            ['name' => 'Hipercard'],
            ['name' => 'Elo'],
            ['name' => 'Visa'],
            ['name' => 'Mastercard'],
            ['name' => 'American Express'],
            ['name' => 'Riachuelo'],
            ['name' => 'Carrefour'],
            ['name' => 'Americanas'],
            ['name' => 'Casas Bahia'],
            ['name' => 'Magazine Luiza'],
            ['name' => 'Renner'],
            ['name' => 'C&A'],
            ['name' => 'Pernambucanas'],
            ['name' => 'Marisa'],
            ['name' => 'Havan'],
            ['name' => 'Submarino'],
            ['name' => 'Ponto Frio'],
            ['name' => 'Ame Digital'],
            ['name' => 'Alelo'],
            ['name' => 'Sodexo'],
            ['name' => 'Ticket'],
            ['name' => 'Porto Seguro Cartões'],
            ['name' => 'Unicred'],
            ['name' => 'Player\'s Bank'],
        ];

        foreach ($banks as $bankData) {
            Card::create($bankData);
        }
    }
}
