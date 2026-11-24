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
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Downloads de planilha gerados no servidor. O arquivo é escrito direto na
 * resposta (OpenSpout em php://output), com os lançamentos lidos em blocos.
 */
class ExportController extends Controller
{
    public function detailed(ExportRequest $request, DetailedReportExport $export): StreamedResponse
    {
        $filters = $this->filters($request);

        return $this->download(
            DetailedReportExport::FILENAME,
            fn (Xlsx $x) => $export->write($x, $request->user()->id, $filters),
        );
    }

    public function transactions(ExportRequest $request, TransactionsExport $export): StreamedResponse
    {
        $filters = $this->filters($request);

        return $this->download(
            TransactionsExport::FILENAME,
            fn (Xlsx $x) => $export->write($x, $request->user()->id, $filters),
        );
    }

    public function pendingInvoices(ExportRequest $request, PendingInvoicesExport $export): StreamedResponse
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
    private function download(string $prefix, Closure $write): StreamedResponse
    {
        return response()->streamDownload(function () use ($write) {
            $x = Xlsx::open('php://output');
            $write($x);
            $x->close();
        }, Xlsx::filename($prefix), [
            'Content-Type' => Xlsx::CONTENT_TYPE,
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
