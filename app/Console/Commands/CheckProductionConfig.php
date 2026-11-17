<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckProductionConfig extends Command
{
    protected $signature = 'app:check-production-config';

    protected $description = 'Verifica se a configuração é segura para produção (debug, cookies seguros e sessão criptografada)';

    public function handle(): int
    {
        $problems = [];

        if (! app()->environment('production')) {
            $problems[] = 'APP_ENV deve ser "production" (atual: '.app()->environment().').';
        }

        if (config('app.debug') !== false) {
            $problems[] = 'APP_DEBUG deve ser false.';
        }

        if (config('session.secure') !== true) {
            $problems[] = 'SESSION_SECURE_COOKIE deve ser true.';
        }

        if (config('session.encrypt') !== true) {
            $problems[] = 'SESSION_ENCRYPT deve ser true.';
        }

        foreach ($problems as $problem) {
            $this->error($problem);
        }

        if ($problems !== []) {
            return self::FAILURE;
        }

        $this->info('Configuração de produção OK.');

        return self::SUCCESS;
    }
}
