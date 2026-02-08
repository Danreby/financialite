import React from 'react'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

/**
 * Estado vazio para quando não há transações
 * Componente modular e reutilizável
 * @param {Function} onClearFilters - Callback para limpar filtros
 * @param {boolean} hasActiveFilters - Se existem filtros ativos
 */
export default function ExtratoEmptyState({ onClearFilters, hasActiveFilters = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
        <span className="text-3xl">📄</span>
      </div>

      {/* Main message */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Nenhuma movimentação encontrada
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
        {hasActiveFilters
          ? 'Não encontramos transações com os filtros aplicados. Tente ajustar os critérios de busca.'
          : 'Você ainda não possui transações registradas neste período.'}
      </p>

      {/* Action button */}
      {hasActiveFilters && onClearFilters && (
        <SecondaryButton onClick={onClearFilters} className="text-sm">
          🔄 Limpar filtros
        </SecondaryButton>
      )}

      {/* Help text */}
      <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 max-w-md">
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs text-blue-700 dark:text-blue-300 text-left">
            <strong>Dica:</strong> As transações aparecem aqui após serem registradas. 
            Você pode filtrar por data, banco, categoria ou tipo de movimentação.
          </p>
        </div>
      </div>
    </div>
  )
}
