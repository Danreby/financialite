import React, { useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { getIconEmoji } from '@/Utils/categoryIcons'

export default function ExtratoCategoryBreakdown({ transactions = [] }) {
  const breakdown = useMemo(() => {
    const flat = transactions.flatMap((group) => group.transactions || [])
    if (flat.length === 0) return []

    const map = {}

    for (const tx of flat) {
      const catName = tx.category_name || 'Sem categoria'
      const catIcon = getIconEmoji(tx.category_icon) || '📁'
      const catColor = tx.category_color || '#6b7280'
      const value = tx.type === 'credit'
        ? (tx.installment_amount ?? tx.amount)
        : tx.amount

      if (!map[catName]) {
        map[catName] = { name: catName, icon: catIcon, color: catColor, total: 0, count: 0 }
      }
      map[catName].total += Number(value) || 0
      map[catName].count += 1
    }

    const items = Object.values(map).sort((a, b) => b.total - a.total)
    const maxTotal = items[0]?.total || 1

    return items.map((item) => ({
      ...item,
      percentage: (item.total / maxTotal) * 100,
    }))
  }, [transactions])

  if (breakdown.length === 0) return null

  const totalAll = breakdown.reduce((s, i) => s + i.total, 0)

  return (
    <div className="rounded-xl p-3 sm:p-4 shadow-sm themed-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
          Gastos por categoria
        </h3>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {breakdown.length} {breakdown.length === 1 ? 'categoria' : 'categorias'}
        </span>
      </div>

      <div className="space-y-2.5 max-h-[320px] overflow-y-auto scrollbar-custom pr-1">
        {breakdown.map((item) => {
          const pct = totalAll > 0 ? ((item.total / totalAll) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {item.count}x
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {pct}%
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrencyBRL(item.total)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">
          Total geral
        </span>
        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
          {formatCurrencyBRL(totalAll)}
        </span>
      </div>
    </div>
  )
}
