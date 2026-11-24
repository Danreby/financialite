import axios from "axios";
import { toast } from "react-toastify";

const DEFAULT_ERROR = "Não foi possível gerar a planilha. Tente de novo.";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

const filenameFrom = (disposition) => {
  if (!disposition) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
};

const errorMessage = async (error) => {
  const response = error?.response;
  if (response?.status === 429) {
    return "Muitas exportações seguidas. Espere um minuto e tente de novo.";
  }
  const data = response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      return json.message || json.error || DEFAULT_ERROR;
    } catch {
      return DEFAULT_ERROR;
    }
  }
  return data?.message || DEFAULT_ERROR;
};

/**
 * Baixa uma planilha gerada no servidor com os filtros atuais da tela.
 * Em caso de erro mostra um toast e devolve false.
 */
export async function downloadExport(url, params = {}, fallbackName = "exportacao.xlsx") {
  try {
    const response = await axios.get(url, { params: cleanParams(params), responseType: "blob" });
    const name = filenameFrom(response.headers?.["content-disposition"]) || fallbackName;
    const href = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch (error) {
    console.error(error);
    toast.error(await errorMessage(error));
    return false;
  }
}

export default downloadExport;
