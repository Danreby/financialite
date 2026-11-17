<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerSqliteDateFormat();
    }

    /**
     * Algumas consultas usam DATE_FORMAT do MySQL. No SQLite dos testes locais
     * registramos um equivalente; no CI (MySQL) a função nativa é usada.
     */
    private function registerSqliteDateFormat(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::connection()->getPdo()->sqliteCreateFunction(
            'DATE_FORMAT',
            fn ($date, $format) => $date === null ? null : date(str_replace(['%Y', '%m', '%d'], ['Y', 'm', 'd'], $format), strtotime($date)),
            2
        );
    }
}
