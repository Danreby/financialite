import React from 'react'
import ScrollArea from '@/Components/common/ScrollArea'
import ExtratoDayGroup from './ExtratoDayGroup'
import ExtratoEmptyState from './ExtratoEmptyState'
import ExtratoTransactionsHeader from './ExtratoTransactionsHeader'

/**
 * Container principal para lista de transações
 * Componente de apresentação puro, sem lógica de negócio
 * @param {Array} transactions - Array de grupos de transações por dia
 * @param {number} totalCount - Total de transações
 * @param {Function} onClearFilters - Callback para limpar filtros
 * @param {boolean} hasActiveFilters - Se há filtros ativos
 */
export default function ExtratoTransactionsContainer({
  transactions = [],
  totalCount = 0,
  onClearFilters,
  hasActiveFilters = false,
}) {
  const isEmpty = transactions.length === 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0b0b0b] overflow-hidden">
      {/* Header */}
      <ExtratoTransactionsHeader count={totalCount} />

      {/* Content */}
      {isEmpty ? (
        <ExtratoEmptyState
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <ScrollArea maxHeightClassName="max-h-[calc(100vh-420px)] min-h-[400px]">
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {transactions.map((group) => (
              <ExtratoDayGroup key={group.date} group={group} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
