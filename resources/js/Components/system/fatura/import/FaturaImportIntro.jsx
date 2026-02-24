import React from "react";
import ExportExcel from "@/Components/system/excel/ExportExcel";

export default function FaturaImportIntro({ templateRows, templateHeader }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Importe várias faturas de uma só vez usando um arquivo
          Excel. Primeiro, baixe o modelo com as colunas corretas ou
          utilize um arquivo que já contenha um cabeçalho na primeira
          linha com os seguintes nomes:
        </p>
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 dark:bg-gray-900 dark:text-gray-200">
          titulo, descricao, valor, tipo, status, parcelas_totais, parcela_atual, recorrente, nome_cartao, nome_categoria
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Os campos <strong>nome_cartao</strong> e{" "}
          <strong>nome_categoria</strong> são opcionais, mas quando
          preenchidos devem usar o <strong>nome exato</strong> dos
          cartões e categorias já cadastradas para garantir a
          vinculação correta.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-theme-accent bg-theme-accent-light p-3 text-center">
        <p className="mb-2 text-xs font-medium text-gray-900 dark:text-gray-100">
          Baixar modelo pronto para preenchimento
        </p>
        <div className="flex justify-center">
          <ExportExcel
            data={templateRows}
            header={templateHeader}
            name="modelo_importacao_faturas"
            currencyColumns={["valor"]}
          />
        </div>
        <p className="mt-2 text-[11px] text-gray-700 dark:text-gray-300">
          O modelo inclui uma linha de exemplo para orientar o
          preenchimento de cada coluna.
        </p>
      </div>
    </div>
  );
}
