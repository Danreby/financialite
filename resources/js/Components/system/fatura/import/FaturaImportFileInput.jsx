import React from "react";

export default function FaturaImportFileInput({ isLoading, fileName, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-200">
        Selecione o arquivo Excel para importar
      </label>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onChange}
        disabled={isLoading}
        className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-3 file:rounded-md file:border-0 file:bg-theme-accent-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-theme-accent hover:file:brightness-95"
      />
      {fileName && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Arquivo selecionado: {fileName}
        </span>
      )}
    </div>
  );
}
