<?php

namespace Database\Seeders;

use App\Models\Bank;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BanksSeeder extends Seeder
{
    public function run(): void
    {
        $banks = [
            ['name' => 'Nubank'],
            ['name' => 'Inter'],
            ['name' => 'C6 Bank'],
            ['name' => 'Banco do Brasil'],
            ['name' => 'Bradesco'],
            ['name' => 'Itaú'],
            ['name' => 'Santander'],
            ['name' => 'PayPal'],
            ['name' => 'PicPay'],
            ['name' => 'Mercado Pago'],
        ];

        foreach ($banks as $bankData) {
            Bank::create($bankData);
        }
    }
}
