import React from 'react'
import ScrollArea from '@/Components/common/ScrollArea'
import ExtratoDayGroup from './ExtratoDayGroup'
import ExtratoEmptyState from './ExtratoEmptyState'
import ExtratoTransactionsHeader from './ExtratoTransactionsHeader'

export default function ExtratoTransactionsContainer({
  transactions = [],
  totalCount = 0,
  onClearFilters,
  hasActiveFilters = false,
  onSelectTransaction,
}) {
  const isEmpty = transactions.length === 0

  return (
    <div className="rounded-2xl shadow-sm themed-card overflow-hidden">
      <ExtratoTransactionsHeader count={totalCount} />

      {isEmpty ? (
        <ExtratoEmptyState
          onClearFilters={onClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <ScrollArea maxHeightClassName="max-h-[calc(100vh-420px)] min-h-[400px]">
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {transactions.map((group) => (
              <ExtratoDayGroup key={group.date} group={group} onSelectTransaction={onSelectTransaction} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
