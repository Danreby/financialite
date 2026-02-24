import React, { useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const CARD_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
]

export default function ReportsCardBreakdown({ transactions = [] }) {
  const breakdown = useMemo(() => {
    if (transactions.length === 0) return []

    const map = {}

    for (const tx of transactions) {
      const cardName = tx.card_name || tx.bank_name || 'Sem cartão'
      const value = tx.type === 'credit'
        ? (tx.installment_amount ?? tx.amount)
        : tx.amount

      if (!map[cardName]) {
        map[cardName] = { name: cardName, total: 0, count: 0, credit: 0, debit: 0, paid: 0, pending: 0 }
      }
      map[cardName].total += Number(value) || 0
      map[cardName].count += 1
      if (tx.type === 'credit') {
        map[cardName].credit += Number(value) || 0
      } else {
        map[cardName].debit += Number(value) || 0
      }
      if (tx.status === 'paid') {
        map[cardName].paid += Number(value) || 0
      } else {
        map[cardName].pending += Number(value) || 0
      }
    }

    const items = Object.values(map).sort((a, b) => b.total - a.total)
    const maxTotal = items[0]?.total || 1

    return items.map((item, idx) => ({
      ...item,
      color: CARD_COLORS[idx % CARD_COLORS.length],
      percentage: (item.total / maxTotal) * 100,
    }))
  }, [transactions])

  if (breakdown.length === 0) {
    return (
      <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gastos por cartão
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Nenhuma transação encontrada.
        </p>
      </div>
    )
  }

  const totalAll = breakdown.reduce((s, i) => s + i.total, 0)

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gastos por cartão
        </h2>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {breakdown.length} {breakdown.length === 1 ? 'cartão' : 'cartões'}
        </span>
      </div>

      <div className="space-y-3">
        {breakdown.map((item) => {
          const pct = totalAll > 0 ? ((item.total / totalAll) * 100).toFixed(1) : '0.0'
          const paidPct = item.total > 0 ? ((item.paid / item.total) * 100).toFixed(0) : '0'
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                      <span>{item.count} transação(ões)</span>
                      <span>·</span>
                      <span className="text-emerald-500">{paidPct}% pago</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-3">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrencyBRL(item.total)}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{pct}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
          <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrencyBRL(totalAll)}
          </span>
        </div>
      </div>
    </div>
  )
}
