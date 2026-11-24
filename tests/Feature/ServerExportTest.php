<?php

namespace Tests\Feature;

use App\Models\Transacao;
use App\Models\User;
use App\Queries\Export\ExportRowsQuery;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use OpenSpout\Reader\XLSX\Reader;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Exportações em planilha geradas no servidor, lidas de volta com o leitor do
 * OpenSpout. Cenário de FinanceScenario (hoje 15/11/2026):
 *
 * Linhas (uma por débito e por mês de fatura): mercadoX3 3x100 (out, nov, dez),
 * cinema 120 (out), streaming 50 (nov, recorrente até o mês atual), padaria 200
 * (débito, out), farmacia 90 (nov), feiraX2 2x30 (nov, dez), bar 80 e acougue 40
 * (débitos, nov). 11 linhas, 940,00 de despesas (620 crédito + 320 débito).
 *
 * Por mês: out 420, nov 390, dez 130. Receita: 5000 recorrente em cada um dos
 * 3 meses + pix avulso 300 em novembro = 15.300,00.
 */
class ServerExportTest extends TestCase
{
    use FinanceScenario;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedFinanceScenario();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_detailed_report_has_the_sheets_headers_and_numbers(): void
    {
        $response = $this->actingAs($this->user)->get(route('reports.export.detailed'));

        $this->assertXlsxDownload($response, 'relatorio_financeiro_detalhado_15-11-2026_10-00.xlsx');
        $book = $this->readXlsx($response);

        $this->assertSame([
            'Resumo Executivo',
            'Transações',
            'Análise por Categoria',
            'Análise por Cartão',
            'Top 20 Transações',
            'Recorrentes vs Não Recorr.',
            'Tendências',
            'Fluxo de Caixa',
        ], array_keys($book));

        // Transações: cabeçalho e 11 linhas, do mais antigo para o mais novo.
        $tx = $book['Transações'];
        $this->assertSame(['ID', 'Data', 'Mês/Ano', 'Tipo', 'Status', 'Título', 'Descrição', 'Valor Total',
            'Valor Parcela', 'Nº Parcela', 'Total Parcelas', 'Recorrente', 'Cartão', 'Categoria',
            'Mês Fatura', 'Data Vencimento'], $tx[0]);
        $this->assertCount(12, $tx);
        $this->assertSame('MercadoX3', $tx[1][5]);
        $this->assertSame('Crédito', $tx[1][3]);
        $this->assertSame('Pago', $tx[1][4]); // 1ª parcela paga com a fatura de outubro
        $this->assertEquals(300, $tx[1][7]);
        $this->assertEquals(100, $tx[1][8]);
        $padaria = $this->rowWithTitle($tx, 'Padaria');
        $this->assertSame('Débito', $padaria[3]);
        $this->assertEquals(200, $padaria[8]);

        // Resumo: débito é despesa; receita vem só das fontes de renda.
        $summary = $this->keyed($book['Resumo Executivo']);
        $this->assertEquals(11, $summary['Total de Transações']);
        $this->assertEqualsWithDelta(15300.0, $summary['Total de Receitas'], 0.001);
        $this->assertEqualsWithDelta(940.0, $summary['Total de Despesas'], 0.001);
        $this->assertEqualsWithDelta(14360.0, $summary['Saldo Líquido'], 0.001);
        $this->assertEqualsWithDelta(620.0, $summary['Total em Crédito'], 0.001);
        $this->assertEqualsWithDelta(320.0, $summary['Total em Débito'], 0.001);
        $this->assertEqualsWithDelta(5100.0, $summary['Receita Média Mensal'], 0.001);

        // Fluxo de caixa: receita do mês - (crédito + débito).
        $cash = $this->keyed($book['Fluxo de Caixa'], 0, null);
        $this->assertSame(['Mês', 'Receitas', 'Despesas', 'Saldo do Mês', 'Saldo Acumulado', 'Taxa de Poupança', 'Qtd Transações'], $book['Fluxo de Caixa'][0]);
        $this->assertEqualsWithDelta(5000.0, $cash['Outubro 2026'][1], 0.001);
        $this->assertEqualsWithDelta(420.0, $cash['Outubro 2026'][2], 0.001);
        $this->assertEqualsWithDelta(5300.0, $cash['Novembro 2026'][1], 0.001);
        $this->assertEqualsWithDelta(390.0, $cash['Novembro 2026'][2], 0.001);
        $this->assertEqualsWithDelta(4910.0, $cash['Novembro 2026'][3], 0.001);
        $this->assertEqualsWithDelta(4580.0 + 4910.0, $cash['Novembro 2026'][4], 0.001);
        $this->assertEqualsWithDelta(130.0, $cash['Dezembro 2026'][2], 0.001);
        $this->assertEqualsWithDelta(14360.0, $cash['TOTAL'][3], 0.001);

        // Categorias: maior total primeiro; débito entra na despesa da categoria.
        $categories = $book['Análise por Categoria'];
        $this->assertSame(['Categoria', 'Total', 'Crédito', 'Débito', 'Qtd', 'Pago', 'Pendente', '% do Total', 'Ticket Médio'], $categories[0]);
        $this->assertSame(['Mercado', 'Lazer', 'Sem categoria', 'TOTAL'], array_column(array_slice($categories, 1), 0));
        $this->assertEqualsWithDelta(600.0, $categories[1][1], 0.001);
        $this->assertEqualsWithDelta(360.0, $categories[1][2], 0.001);
        $this->assertEqualsWithDelta(240.0, $categories[1][3], 0.001);
        $this->assertEqualsWithDelta(600 / 940, $categories[1][7], 0.0001);

        $cards = $this->keyed($book['Análise por Cartão'], 0, null);
        $this->assertEqualsWithDelta(300 + 120 + 50 + 200 + 90, $cards['Cartão Azul'][1], 0.001);
        $this->assertEqualsWithDelta(60 + 80 + 40, $cards['Sem cartão'][1], 0.001);

        // Top 20: maior linha é a padaria (200,00).
        $this->assertSame('Padaria', $book['Top 20 Transações'][1][1]);
        $this->assertEqualsWithDelta(200.0, $book['Top 20 Transações'][1][4], 0.001);

        // Tendências: nov vs out e dez vs nov. O leitor pula linhas vazias, então
        // a tabela é localizada pelo cabeçalho.
        $trends = $book['Tendências'];
        $header = array_search(['Mês', 'Valor Atual', 'Valor Anterior', 'Variação R$', 'Taxa de Crescimento'], $trends, true);
        $this->assertNotFalse($header);
        $this->assertSame('Novembro 2026', $trends[$header + 1][0]);
        $this->assertEqualsWithDelta(390 - 420, $trends[$header + 1][3], 0.001);
        $this->assertSame('Dezembro 2026', $trends[$header + 2][0]);
        $this->assertEqualsWithDelta((130 - 390) / 390, $trends[$header + 2][4], 0.0001);
        $this->assertSame('Outubro 2026', $this->keyed($trends)['Mês Maior Gasto:']);

        // Recorrentes: só o streaming (50,00).
        $recurring = $this->keyed($book['Recorrentes vs Não Recorr.'], 0, null);
        $this->assertEquals(1, $recurring['Quantidade'][1]);
        $this->assertEquals(10, $recurring['Quantidade'][2]);
        $this->assertEqualsWithDelta(50.0, $recurring['Valor Total'][1], 0.001);
        $this->assertEqualsWithDelta(890.0, $recurring['Valor Total'][2], 0.001);
        $this->assertArrayHasKey('COMPARATIVO', $recurring);
    }

    public function test_detailed_report_respects_filters(): void
    {
        $book = $this->readXlsx($this->actingAs($this->user)->get(route('reports.export.detailed', [
            'category_id' => $this->lazer->id,
        ])));
        // Lazer: cinema 120, streaming 50, bar 80 (débito).
        $this->assertCount(4, $book['Transações']);
        $this->assertEqualsWithDelta(250.0, $this->keyed($book['Resumo Executivo'])['Total de Despesas'], 0.001);

        $book = $this->readXlsx($this->actingAs($this->user)->get(route('reports.export.detailed', [
            'search' => 'FEIRA',
        ])));
        // Busca no título, sem diferenciar maiúsculas: as duas parcelas da feira.
        $this->assertSame(['FeiraX2', 'FeiraX2'], array_column(array_slice($book['Transações'], 1), 5));
        $this->assertArrayHasKey('Tendências', $book); // nov e dez

        $book = $this->readXlsx($this->actingAs($this->user)->get(route('reports.export.detailed', [
            'search' => 'padaria',
        ])));
        // Um único mês: sem aba de tendências; fluxo com outubro e o total.
        $this->assertArrayNotHasKey('Tendências', $book);
        $this->assertSame(['Outubro 2026', 'TOTAL'], array_column(array_slice($book['Fluxo de Caixa'], 1), 0));
        $this->assertEqualsWithDelta(5000.0 - 200.0, $book['Fluxo de Caixa'][1][3], 0.001);
    }

    public function test_year_and_card_filters(): void
    {
        $book = $this->readXlsx($this->actingAs($this->user)->get(route('transacoes.export.xlsx', ['year' => '2025'])));
        $this->assertCount(1, $book['Transações']);

        $book = $this->readXlsx($this->actingAs($this->user)->get(route('transacoes.export.xlsx', [
            'bank_user_id' => $this->card->id,
        ])));
        // No cartão: mercadoX3 (3), cinema, streaming, padaria, farmacia.
        $this->assertCount(1 + 7, $book['Transações']);
    }

    public function test_transactions_export_columns(): void
    {
        $response = $this->actingAs($this->user)->get(route('transacoes.export.xlsx'));

        $this->assertXlsxDownload($response, 'transacoes_faturas_15-11-2026_10-00.xlsx');
        $rows = $this->readXlsx($response)['Transações'];

        $this->assertSame(['Mês/Ano', 'Data', 'Tipo', 'Status', 'Título', 'Descrição', 'Valor',
            'Parcelas Totais', 'Parcela Atual', 'Recorrente', 'Cartão', 'Categoria'], $rows[0]);
        $this->assertCount(12, $rows);

        $bar = $this->rowWithTitle($rows, 'Bar', 4);
        $this->assertSame(['Novembro 2026', '08/11/2026 12:00', 'Débito'], array_slice($bar, 0, 3));
        $this->assertEqualsWithDelta(80.0, $bar[6], 0.001);
        $this->assertSame('Não', $bar[9]);
        $this->assertSame('Lazer', $bar[11]);
    }

    public function test_pending_invoices_export(): void
    {
        $response = $this->actingAs($this->user)->get(route('faturas.export.pending'));

        $this->assertXlsxDownload($response, 'faturas_pendentes_15-11-2026_10-00.xlsx');
        $rows = $this->readXlsx($response)['Faturas pendentes'];

        // Outubro está paga e some. Em aberto: nov/2026 até nov/2027 (o streaming
        // recorrente é projetado por 12 meses).
        $this->assertSame('Categoria / Compra', $rows[0][0]);
        $this->assertSame('Novembro 2026', $rows[0][1]);
        $this->assertSame('Novembro 2027', $rows[0][13]);
        $this->assertSame('TOTAL', $rows[0][14]);

        // Ordem da tela: rótulos na ordem em que aparecem em novembro.
        $this->assertSame(['Mercado', 'Farmacia', 'Lazer', 'TOTAL GERAL'], array_column(array_slice($rows, 1), 0));
        $this->assertEqualsWithDelta(130.0, $rows[1][1], 0.001); // feira 30 + mercado 100
        $this->assertEqualsWithDelta(130.0, $rows[1][2], 0.001);
        $this->assertEqualsWithDelta(260.0, $rows[1][14], 0.001);
        $this->assertEqualsWithDelta(90.0, $rows[2][1], 0.001);
        $this->assertEqualsWithDelta(650.0, $rows[3][14], 0.001);
        $this->assertEqualsWithDelta(1000.0, $rows[4][14], 0.001);
    }

    public function test_other_users_data_never_appears(): void
    {
        $other = User::factory()->create();
        Transacao::factory()->debit()->create(['user_id' => $other->id, 'title' => 'Segredo do outro']);

        foreach (['reports.export.detailed', 'transacoes.export.xlsx'] as $name) {
            $book = $this->readXlsx($this->actingAs($this->user)->get(route($name)));
            $this->assertStringNotContainsString('Segredo do outro', json_encode($book, JSON_UNESCAPED_UNICODE));

            $mine = $this->readXlsx($this->actingAs($other)->get(route($name)));
            $this->assertCount(2, $mine['Transações']);
            $this->assertStringNotContainsString('MercadoX3', json_encode($mine, JSON_UNESCAPED_UNICODE));
        }

        // Cartão de outro usuário: 404. Categoria de outro usuário: 422.
        foreach (['reports.export.detailed', 'transacoes.export.xlsx', 'faturas.export.pending'] as $name) {
            $this->actingAs($other)->get(route($name, ['bank_user_id' => $this->card->id]))->assertNotFound();
            $this->actingAs($other)->getJson(route($name, ['category_id' => $this->mercado->id]))->assertStatus(422);
        }
    }

    public function test_guests_are_redirected(): void
    {
        $this->get(route('reports.export.detailed'))->assertRedirect(route('login'));
    }

    public function test_large_dataset_is_read_in_chunks(): void
    {
        $now = now()->toDateTimeString();
        foreach (array_chunk(range(1, 2000), 500) as $chunk) {
            DB::table('transacoes')->insert(array_map(fn ($i) => [
                'user_id' => $this->user->id,
                'title' => "Compra {$i}",
                'amount' => '10.00',
                'type' => 'debit',
                'status' => 'paid',
                'total_installments' => 1,
                'current_installment' => 0,
                'is_recurring' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ], $chunk));
        }

        $selects = [];
        DB::listen(function ($query) use (&$selects) {
            if (preg_match('/^select \* from [`"]transacoes[`"]/i', $query->sql)) {
                $selects[] = $query->sql;
            }
        });

        memory_reset_peak_usage();
        $before = memory_get_usage();
        $response = $this->actingAs($this->user)->get(route('reports.export.detailed'));
        $content = $response->streamedContent();
        $peak = memory_get_peak_usage() - $before;

        // 2008 lançamentos em blocos de 500: 5 consultas com limit.
        $this->assertGreaterThanOrEqual(5, count($selects));
        foreach ($selects as $sql) {
            $this->assertStringContainsString('limit '.ExportRowsQuery::CHUNK_SIZE, $sql);
        }
        $this->assertLessThan(48 * 1024 * 1024, $peak, 'Pico de memória alto demais: '.round($peak / 1048576, 1).' MB');

        $book = $this->readXlsx($content);
        $this->assertCount(1 + 11 + 2000, $book['Transações']);
        $this->assertEqualsWithDelta(940.0 + 20000.0, $this->keyed($book['Resumo Executivo'])['Total de Despesas'], 0.001);
    }

    private function assertXlsxDownload(TestResponse $response, string $filename): void
    {
        $response->assertOk();
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $response->headers->get('Content-Type'),
        );
        $this->assertStringContainsString('attachment; filename='.$filename, (string) $response->headers->get('Content-Disposition'));
    }

    /**
     * @return array<string, list<list<mixed>>>
     */
    private function readXlsx(TestResponse|string $response): array
    {
        $content = is_string($response) ? $response : $response->assertOk()->streamedContent();
        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        file_put_contents($path, $content);

        $reader = new Reader;
        $reader->open($path);
        $book = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $rows = [];
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = $row->toArray();
            }
            $book[$sheet->getName()] = $rows;
        }
        $reader->close();
        @unlink($path);

        return $book;
    }

    /**
     * Linhas indexadas pela primeira coluna; com $valueColumn null devolve a linha inteira.
     *
     * @param  list<list<mixed>>  $rows
     * @return array<string, mixed>
     */
    private function keyed(array $rows, int $keyColumn = 0, ?int $valueColumn = 1): array
    {
        $keyed = [];
        foreach ($rows as $row) {
            if (! isset($row[$keyColumn]) || $row[$keyColumn] === '') {
                continue;
            }
            $keyed[(string) $row[$keyColumn]] = $valueColumn === null ? $row : ($row[$valueColumn] ?? null);
        }

        return $keyed;
    }

    /**
     * @param  list<list<mixed>>  $rows
     * @return list<mixed>
     */
    private function rowWithTitle(array $rows, string $title, int $column = 5): array
    {
        foreach ($rows as $row) {
            if (($row[$column] ?? null) === $title) {
                return $row;
            }
        }
        $this->fail("Linha {$title} não encontrada.");
    }
}
