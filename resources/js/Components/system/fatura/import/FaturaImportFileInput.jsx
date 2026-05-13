import React, { useRef } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

export default function FaturaImportFileInput({ isLoading, fileName, onChange }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Arquivo Excel
      </label>
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isLoading
            ? 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30 cursor-not-allowed opacity-60'
            : fileName
            ? 'border-theme-accent bg-theme-accent-light dark:bg-[rgba(var(--theme-accent-rgb),0.08)] cursor-pointer'
            : 'border-gray-300 bg-gray-50 hover:border-theme-accent hover:bg-theme-accent-light/40 dark:border-gray-700 dark:bg-gray-900/30 dark:hover:border-theme-accent cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onChange}
          disabled={isLoading}
          className="hidden"
        />

        {fileName ? (
          <>
            <FileSpreadsheet className="w-9 h-9 text-theme-accent" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">{fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clique para trocar o arquivo</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-9 h-9 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Clique para selecionar
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Formatos aceitos: <span className="font-medium">.xlsx, .xls, .csv</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
