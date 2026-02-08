import React from 'react'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

/**
 * Barra de ações rápidas do extrato
 * Componente modular para ações como exportar, imprimir, etc
 * @param {number} transactionCount - Número de transações
 * @param {Function} onExport - Callback para exportar (futuro)
 */
export default function ExtratoActionsBar({ transactionCount = 0, onExport }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/30">
      {/* Info */}
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            Extrato Detalhado
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {transactionCount > 0
              ? `Exibindo ${transactionCount} ${transactionCount === 1 ? 'registro' : 'registros'}`
              : 'Nenhum registro para exibir'}
          </p>
        </div>
      </div>

      {/* Actions */}
      {transactionCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Export button (placeholder para futura implementação) */}
          <SecondaryButton
            onClick={onExport}
            disabled={!onExport}
            className="text-xs !py-1.5 !px-3"
            title="Exportar extrato (em breve)"
          >
            <span className="flex items-center gap-1.5">
              <span>📥</span>
              <span className="hidden sm:inline">Exportar</span>
            </span>
          </SecondaryButton>
        </div>
      )}
    </div>
  )
}
