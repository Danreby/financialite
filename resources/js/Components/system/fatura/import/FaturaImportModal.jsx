import React, { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import FaturaImportIntro from "@/Components/system/fatura/import/FaturaImportIntro";
import FaturaImportFileInput from "@/Components/system/fatura/import/FaturaImportFileInput";
import FaturaImportPreview from "@/Components/system/fatura/import/FaturaImportPreview";
import FaturaImportActions from "@/Components/system/fatura/import/FaturaImportActions";

const COLUMN_MAP = Object.freeze({
  titulo: "title",
  descricao: "description",
  valor: "amount",
  tipo: "type",
  status: "status",
  parcelas_totais: "total_installments",
  parcela_atual: "current_installment",
  recorrente: "is_recurring",
  nome_cartao: "bank_user_name",
  nome_categoria: "category_name",
  title: "title",
  description: "description",
  amount: "amount",
  type: "type",
  total_installments: "total_installments",
  current_installment: "current_installment",
  is_recurring: "is_recurring",
  bank_user_name: "bank_user_name",
  category_name: "category_name",
});

const REQUIRED_API_KEYS = ["title", "amount", "type"];

const API_KEY_LABELS = Object.freeze({
  title: "titulo",
  amount: "valor",
  type: "tipo",
});

function normalizeHeaderKey(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function mapRowToApiKeys(row, originalHeaders) {
  const mapped = {};
  originalHeaders.forEach((header) => {
    const apiKey = COLUMN_MAP[normalizeHeaderKey(header)];
    if (apiKey) {
      mapped[apiKey] = row[header];
    }
  });
  return mapped;
}

export default function FaturaImportModal({ isOpen, onClose, onImported }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const templateHeader = useMemo(
    () => ({
      title: { name: "titulo" },
      description: { name: "descricao" },
      amount: { name: "valor" },
      type: { name: "tipo" },
      status: { name: "status" },
      total_installments: { name: "parcelas_totais" },
      current_installment: { name: "parcela_atual" },
      is_recurring: { name: "recorrente" },
      bank_user_name: { name: "nome_cartao" },
      category_name: { name: "nome_categoria" },
    }),
    []
  );

  const templateRows = useMemo(
    () => [
      {
        title: "Compra supermercado",
        description: "Mercado do bairro",
        amount: 250.75,
        type: "debit",
        status: "paid",
        total_installments: 1,
        current_installment: 1,
        is_recurring: false,
        bank_user_name: "Nome do cartão (opcional)",
        category_name: "Nome da categoria (opcional)",
      },
    ],
    []
  );

  const resetState = useCallback(() => {
    setFileName("");
    setRows([]);
    setHeaders([]);
    setIsLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    resetState();
    onClose?.();
  }, [isLoading, resetState, onClose]);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    toast.dismiss();

    try {
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (file.type && !allowedTypes.includes(file.type)) {
        toast.error("Selecione um arquivo Excel (.xlsx, .xls ou .csv).");
        setIsLoading(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          if (!sheetData || sheetData.length < 2) {
            toast.error("O arquivo não contém dados suficientes.");
            setIsLoading(false);
            return;
          }

          const [headerRow, ...dataRows] = sheetData;
          const originalHeaders = headerRow.map((h) =>
            String(h || "").trim()
          );

          const resolvedApiKeys = originalHeaders.map(
            (h) => COLUMN_MAP[normalizeHeaderKey(h)]
          );
          const detectedKeys = new Set(resolvedApiKeys.filter(Boolean));
          const missingRequired = REQUIRED_API_KEYS.filter(
            (k) => !detectedKeys.has(k)
          );

          if (missingRequired.length > 0) {
            const labels = missingRequired.map(
              (k) => API_KEY_LABELS[k] || k
            );
            toast.error(
              `Colunas obrigatórias não encontradas: ${labels.join(", ")}.`
            );
            setIsLoading(false);
            return;
          }

          const parsedRows = dataRows
            .filter((row) =>
              row.some(
                (cell) =>
                  cell !== null &&
                  cell !== undefined &&
                  String(cell).trim() !== ""
              )
            )
            .map((row) => {
              const obj = {};
              originalHeaders.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });

          setHeaders(originalHeaders);
          setRows(parsedRows);
          setIsLoading(false);
          toast.success(
            "Arquivo carregado. Revise os dados antes de confirmar."
          );
        } catch (error) {
          console.error(error);
          toast.error("Não foi possível ler o arquivo Excel.");
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo.");
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o arquivo.");
      setIsLoading(false);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!rows || rows.length === 0) {
      toast.error("Nenhum dado para importar.");
      return;
    }

    setIsLoading(true);
    toast.dismiss();

    try {
      const apiRows = rows.map((row) => mapRowToApiKeys(row, headers));

      const response = await axios.post(route("transacoes.import"), {
        rows: apiRows,
      });

      const payload = response.data || {};
      const importedCount = Number(payload.imported_count || 0);

      if (importedCount > 0) {
        toast.success(`${importedCount} fatura(s) importada(s) com sucesso.`);
      } else {
        toast.info("Nenhuma fatura foi importada.");
      }

      if (onImported) onImported(payload);
      resetState();
      onClose?.();
    } catch (error) {
      console.error(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erro ao importar faturas.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [rows, headers, resetState, onClose, onImported]);

  const hasPreview = headers.length > 0 && rows.length > 0;
  const previewRows = hasPreview ? rows.slice(0, 10) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title="Importar faturas via Excel"
    >
      <div className="space-y-6">
        <FaturaImportIntro
          templateRows={templateRows}
          templateHeader={templateHeader}
        />

        <FaturaImportFileInput
          isLoading={isLoading}
          fileName={fileName}
          onChange={handleFileChange}
        />

        <FaturaImportPreview
          hasPreview={hasPreview}
          headers={headers}
          previewRows={previewRows}
          rows={rows}
        />

        <FaturaImportActions
          isLoading={isLoading}
          hasPreview={hasPreview}
          onCancel={handleClose}
          onConfirm={handleConfirmImport}
        />
      </div>
    </Modal>
  );
}
