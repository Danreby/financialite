import React from 'react'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

export default function ExtratoActionsBar({ transactionCount = 0, onExport }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 themed-card">
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

      {transactionCount > 0 && (
        <div className="flex items-center gap-2">
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
