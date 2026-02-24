import React, { useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { getIconEmoji } from '@/Utils/categoryIcons'

export default function ReportsCategoryBreakdown({ transactions = [] }) {
  const breakdown = useMemo(() => {
    if (transactions.length === 0) return []

    const map = {}

    for (const tx of transactions) {
      const catName = tx.category_name || 'Sem categoria'
      const catIcon = getIconEmoji(tx.category_icon) || '📁'
      const catColor = tx.category_color || '#6b7280'
      const value = tx.type === 'credit'
        ? (tx.installment_amount ?? tx.amount)
        : tx.amount

      if (!map[catName]) {
        map[catName] = { name: catName, icon: catIcon, color: catColor, total: 0, count: 0, credit: 0, debit: 0 }
      }
      map[catName].total += Number(value) || 0
      map[catName].count += 1
      if (tx.type === 'credit') {
        map[catName].credit += Number(value) || 0
      } else {
        map[catName].debit += Number(value) || 0
      }
    }

    const items = Object.values(map).sort((a, b) => b.total - a.total)
    const maxTotal = items[0]?.total || 1

    return items.map((item) => ({
      ...item,
      percentage: (item.total / maxTotal) * 100,
    }))
  }, [transactions])

  if (breakdown.length === 0) {
    return (
      <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gastos por categoria
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Nenhuma transação encontrada.
        </p>
      </div>
    )
  }

  const totalAll = breakdown.reduce((s, i) => s + i.total, 0)
  const top5 = breakdown.slice(0, 5)
  const rest = breakdown.slice(5)
  const restTotal = rest.reduce((s, i) => s + i.total, 0)

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Gastos por categoria
        </h2>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {breakdown.length} {breakdown.length === 1 ? 'categoria' : 'categorias'} · {transactions.length} transações
        </span>
      </div>

      <div className="space-y-3">
        {top5.map((item) => {
          const pct = totalAll > 0 ? ((item.total / totalAll) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {item.count} transação(ões)
                    </span>
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

        {rest.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{rest.length} outra(s) categoria(s)
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {formatCurrencyBRL(restTotal)}
              </span>
            </div>
          </div>
        )}
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
