import React from 'react'
import ExtratoTransactionRow from './ExtratoTransactionRow'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export default function ExtratoDayGroup({ group }) {
  const { label, day_total, transactions = [] } = group

  return (
    <div className="space-y-1">
      {/* Header do dia */}
      <div className="flex items-center justify-between px-3 py-2 sticky top-0 z-10 bg-gray-50/95 dark:bg-[#070707]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/50">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Total pago: {formatCurrency(day_total)}
        </span>
      </div>

      {/* Transações */}
      <div className="space-y-0.5">
        {transactions.map((tx) => (
          <ExtratoTransactionRow key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  )
}
