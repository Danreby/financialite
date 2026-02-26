<?php

namespace Database\Seeders;

use App\Models\Bank;
use Illuminate\Database\Seeder;

class BankInstitutionsSeeder extends Seeder
{
    public function run(): void
    {
        $institutions = [
            // Grandes bancos tradicionais
            'Banco do Brasil',
            'Bradesco',
            'Caixa Econômica Federal',
            'Itaú',
            'Santander',
            // Bancos digitais
            'BTG Pactual',
            'C6 Bank',
            'Inter',
            'Neon',
            'Next',
            'Nubank',
            'Player\'s Bank',
            // Bancos regionais e médios
            'Agibank',
            'Banrisul',
            'Banco BMG',
            'Banco BS2',
            'Banco BV',
            'Banco Daycoval',
            'Banco de Brasília',
            'Banco do Nordeste',
            'Banco Modal',
            'Banco Original',
            'Banco PAN',
            'Banco Safra',
            'Citibank Brasil',
            'Sicoob',
            'Sicredi',
            'Unicred',
            // Fintechs / carteiras digitais
            'Ame Digital',
            'Mercado Pago',
            'PagSeguro',
            'PayPal',
            'PicPay',
            // Investimentos
            'XP Investimentos',
            // Outros
            'Alelo',
        ];

        foreach ($institutions as $name) {
            Bank::firstOrCreate(['name' => $name]);
        }
    }
}
