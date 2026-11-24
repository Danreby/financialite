import ServerExportButton from "@/Components/system/excel/ServerExportButton";
import { DetailedReportIcon, TableDownloadIcon } from "@/Components/system/excel/ExportIcons";

export default function ReportExportButtons({ filters = {} }) {
  return (
    <div className="flex gap-2">
      <ServerExportButton
        routeName="transacoes.export.xlsx"
        params={filters}
        label="Exportar tabela para Excel"
        icon={TableDownloadIcon}
        fallbackName="transacoes_faturas.xlsx"
      />
      <ServerExportButton
        routeName="reports.export.detailed"
        params={filters}
        label="Exportar relatório detalhado e completo com 8 abas de análises"
        icon={DetailedReportIcon}
        fallbackName="relatorio_financeiro_detalhado.xlsx"
      />
    </div>
  );
}
