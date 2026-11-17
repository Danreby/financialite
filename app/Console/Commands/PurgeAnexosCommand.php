<?php

namespace App\Console\Commands;

use App\Models\Anexo;
use Illuminate\Console\Command;

class PurgeAnexosCommand extends Command
{
    protected $signature = 'anexos:purge {--days=30 : Dias na lixeira antes de apagar de vez}';

    protected $description = 'Apaga de vez (registro e arquivo) anexos que estão na lixeira há mais de 30 dias';

    public function handle(): int
    {
        $limite = now()->subDays((int) $this->option('days'));
        $total = 0;

        Anexo::onlyTrashed()
            ->where('deleted_at', '<', $limite)
            ->lazyById()
            ->each(function (Anexo $anexo) use (&$total) {
                $anexo->forceDelete();
                $total++;
            });

        $this->info("{$total} anexo(s) apagado(s) definitivamente.");

        return self::SUCCESS;
    }
}
