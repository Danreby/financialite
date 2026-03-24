import React, { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import ScrollArea from '@/Components/common/ScrollArea'

const FALLBACK_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
]

export default function ResumoExpensesByCategory({ expenses = [] }) {
  const totalExpenses = useMemo(() => expenses.reduce((acc, e) => acc + (e.total || 0), 0), [expenses])

  return (
    <div className="themed-card rounded-2xl p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
          Despesas por Categoria
        </h2>
        <span className="text-xs sm:text-sm font-bold text-red-500 dark:text-red-400">
          {formatCurrencyBRL(totalExpenses)}
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma despesa registrada</p>
        </div>
      ) : (
        <ScrollArea maxHeightClassName="max-h-[320px]" className="flex-1 space-y-2.5 pr-1">
          {expenses.map((expense, idx) => {
            const color = expense.category_color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
            const percentage = totalExpenses > 0 ? ((expense.total / totalExpenses) * 100).toFixed(1) : 0

            return (
              <div key={expense.category_id ?? idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {expense.category_icon && (
                      <span className="text-sm flex-shrink-0">{expense.category_icon}</span>
                    )}
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {expense.category_name}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                      ({expense.count})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{percentage}%</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrencyBRL(expense.total)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Number(percentage))}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </ScrollArea>
      )}
    </div>
  )
}
