import { useState } from "react";
import DownloadIconButton from "@/Components/common/buttons/DownloadIconButton";
import { downloadExport } from "@/Lib/downloadExport";

/**
 * Botão que baixa uma planilha gerada no servidor. Ignora cliques repetidos
 * enquanto o arquivo está sendo gerado.
 */
export default function ServerExportButton({ routeName, params = {}, label, icon, fallbackName }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadExport(route(routeName), params, fallbackName);
    } finally {
      setBusy(false);
    }
  };

  return <DownloadIconButton label={label} onClick={handleClick} icon={icon} />;
}
