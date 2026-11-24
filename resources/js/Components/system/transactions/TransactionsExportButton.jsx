import ServerExportButton from "@/Components/system/excel/ServerExportButton";
import { DetailedReportIcon, TableDownloadIcon } from "@/Components/system/excel/ExportIcons";

export default function TransactionsExportButton({ filters = {}, detailed = false }) {
  if (detailed) {
    return (
      <ServerExportButton
        routeName="reports.export.detailed"
        params={filters}
        label="Exportar relatório detalhado"
        icon={DetailedReportIcon}
        fallbackName="relatorio_financeiro_detalhado.xlsx"
      />
    );
  }

  return (
    <ServerExportButton
      routeName="transacoes.export.xlsx"
      params={filters}
      label="Exportar tabela para Excel"
      icon={TableDownloadIcon}
      fallbackName="transacoes_faturas.xlsx"
    />
  );
}
