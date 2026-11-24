import { useMemo } from "react";
import ServerExportButton from "@/Components/system/excel/ServerExportButton";
import { TableDownloadIcon } from "@/Components/system/excel/ExportIcons";

// Só aparece quando há alguma parcela em aberto numa fatura não paga.
const hasPendingItems = (monthlyGroups = []) =>
  monthlyGroups.some(
    (group) =>
      group?.month_key &&
      !group.is_paid &&
      (group.items || []).some((item) => item && item.status !== "paid"),
  );

export default function FaturaPendingExportButton({ monthlyGroups = [], filters = {} }) {
  const visible = useMemo(() => hasPendingItems(monthlyGroups), [monthlyGroups]);

  if (!visible) {
    return null;
  }

  return (
    <ServerExportButton
      routeName="faturas.export.pending"
      params={{
        bank_user_id: filters?.bank_user_id || undefined,
        category_id: filters?.category_id || undefined,
      }}
      label="Exportar faturas pendentes para Excel"
      icon={TableDownloadIcon}
      fallbackName="faturas_pendentes.xlsx"
    />
  );
}
