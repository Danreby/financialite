<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExportRequest;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Queries\Export\DetailedReportExport;
use App\Queries\Export\ExportFilters;
use App\Queries\Export\PendingInvoicesExport;
use App\Queries\Export\TransactionsExport;
use App\Queries\Export\Xlsx;
use Closure;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Downloads de planilha gerados no servidor, com os lançamentos lidos em blocos.
 *
 * A planilha é gerada inteira num arquivo temporário antes de responder. O
 * OpenSpout só monta o .xlsx (zip) no close(); se a resposta já tivesse saído
 * com 200, um erro no meio viraria um arquivo corrompido baixado como sucesso.
 * Assim, uma falha vira 500 e a tela mostra o toast de erro.
 */
class ExportController extends Controller
{
    /**
     * Pasta (dentro de sys_get_temp_dir()) do arquivo gerado e da pasta de
     * trabalho do OpenSpout. Pública para o teste conferir que nada fica para
     * trás quando a geração falha.
     */
    public const TEMP_DIR = 'financialite-exports';

    public function detailed(ExportRequest $request, DetailedReportExport $export): BinaryFileResponse
    {
        $filters = $this->filters($request);

        return $this->download(
            DetailedReportExport::FILENAME,
            fn (Xlsx $x) => $export->write($x, $request->user()->id, $filters),
        );
    }

    public function transactions(ExportRequest $request, TransactionsExport $export): BinaryFileResponse
    {
        $filters = $this->filters($request);

        return $this->download(
            TransactionsExport::FILENAME,
            fn (Xlsx $x) => $export->write($x, $request->user()->id, $filters),
        );
    }

    public function pendingInvoices(ExportRequest $request, PendingInvoicesExport $export): BinaryFileResponse
    {
        $filters = $this->filters($request);

        return $this->download(
            PendingInvoicesExport::FILENAME,
            fn (Xlsx $x) => $export->write($x, $request->user()->id, $filters->bankUserId, $filters->categoryId),
        );
    }

    /** Valida os filtros; um cartão de outro usuário dá 404, como nas outras telas. */
    private function filters(ExportRequest $request): ExportFilters
    {
        $this->authorize('viewAny', Transacao::class);

        $filters = ExportFilters::fromArray($request->validated());

        if ($filters->bankUserId !== null) {
            CardUser::forUser($request->user()->id)->findOrFail($filters->bankUserId);
        }

        return $filters;
    }

    /** @param Closure(Xlsx): void $write */
    private function download(string $prefix, Closure $write): BinaryFileResponse
    {
        // Contas grandes podem passar do limite padrão de 30 s do PHP.
        if (function_exists('set_time_limit')) {
            set_time_limit(120);
        }

        $dir = self::tempDir();
        $path = tempnam($dir, 'xls');
        if ($path === false) {
            throw new \RuntimeException('Não foi possível criar o arquivo temporário da exportação.');
        }

        $x = null;
        try {
            $x = Xlsx::open($path, $dir);
            $write($x);
            $x->close();
        } catch (Throwable $e) {
            // close() também apaga a pasta temporária do OpenSpout.
            try {
                $x?->close();
            } catch (Throwable) {
            }
            @unlink($path);

            throw $e;
        }

        return response()->download($path, Xlsx::filename($prefix), [
            'Content-Type' => Xlsx::CONTENT_TYPE,
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ])->deleteFileAfterSend();
    }

    public static function tempDir(): string
    {
        $dir = sys_get_temp_dir().DIRECTORY_SEPARATOR.self::TEMP_DIR;
        if (! is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }

        return $dir;
    }
}
