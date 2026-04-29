import React, { useMemo } from 'react'
import CategoryBadge from '@/Components/common/CategoryBadge'
import { formatCurrencyBRL } from '@/Lib/formatters'

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReportsTopTransactions({ transactions = [], onSelect, limit = 8 }) {
    const deduped = useMemo(() => {
    const seen = new Map()
    for (const tx of transactions) {
      const baseId = String(tx.id).replace(/-\d+$/, '')
      if (!seen.has(baseId)) {
        seen.set(baseId, tx)
      }
    }
    return [...seen.values()]
  }, [transactions])

  const top = [...deduped]
    .sort((a, b) => {
      const av = a.type === 'credit' ? (a.installment_amount ?? a.amount) : a.amount
      const bv = b.type === 'credit' ? (b.installment_amount ?? b.amount) : b.amount
      return bv - av
    })
    .slice(0, limit)

  if (top.length === 0) {
    return (
      <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Maiores transações
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Nenhuma transação encontrada.
        </p>
      </div>
    )
  }

  const maxValue = top[0]
    ? (top[0].type === 'credit'
        ? (top[0].installment_amount ?? top[0].amount)
        : top[0].amount)
    : 1

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Maiores transações
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Top {top.length} por valor no período
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {top.map((tx, i) => {
          const value = tx.type === 'credit' ? (tx.installment_amount ?? tx.amount) : tx.amount
          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
          const isCredit = tx.type === 'credit'

          return (
            <div
              key={`${tx.id}-${i}`}
              className={`rounded-xl p-2.5 border border-transparent transition-colors ${
                onSelect
                  ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:border-gray-100 dark:hover:border-white/[0.07] active:bg-gray-100 dark:active:bg-white/[0.07]'
                  : ''
              }`}
              onClick={() => onSelect?.(tx)}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelect(tx)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {tx.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {tx.category_name && (
                        <CategoryBadge
                          name={tx.category_name}
                          icon={tx.category_icon}
                          color={tx.category_color}
                          size="sm"
                        />
                      )}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-xs sm:text-sm font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'themed-amount'}`}>
                    {formatCurrencyBRL(value)}
                  </span>
                  {isCredit && tx.total_installments > 1 && (
                    <span className="text-[9px] text-gray-400 dark:text-gray-500">
                      {tx.display_installment ?? tx.current_installment ?? 1}/{tx.total_installments}x
                    </span>
                  )}
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isCredit
                      ? 'bg-emerald-400 dark:bg-emerald-500'
                      : 'bg-red-400 dark:bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
