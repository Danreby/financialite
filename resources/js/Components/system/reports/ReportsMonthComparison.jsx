import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

function DeltaChip({ value, inverted = false }) {
  if (value === null || value === undefined) return null
  const positive = inverted ? value < 0 : value > 0
  const neutral = value === 0
  const pct = Math.abs(value).toFixed(1)

  if (neutral) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
        ↔ 0%
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        positive
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
      }`}
    >
      {positive ? '↑' : '↓'} {pct}%
    </span>
  )
}

export default function ReportsMonthComparison({ monthlySummary = [] }) {
  if (monthlySummary.length < 2) return null

  const sorted = [...monthlySummary].sort((a, b) =>
    (a.year_month || '').localeCompare(b.year_month || '')
  )

  const current = sorted[sorted.length - 1]
  const previous = sorted[sorted.length - 2]

  if (!current || !previous) return null

  const pctChange = (cur, prev) => {
    if (!prev || prev === 0) return null
    return ((cur - prev) / prev) * 100
  }

  const debitDelta = pctChange(current.total_debit, previous.total_debit)
  const creditDelta = pctChange(current.total_credit, previous.total_credit)
  const totalDelta = pctChange(current.total_amount, previous.total_amount)

  const rows = [
    {
      label: 'Total geral',
      cur: current.total_amount,
      prev: previous.total_amount,
      delta: totalDelta,
      inverted: true,
    },
    {
      label: 'Débito',
      cur: current.total_debit,
      prev: previous.total_debit,
      delta: debitDelta,
      inverted: true,
    },
    {
      label: 'Crédito (parcela)',
      cur: current.total_credit,
      prev: previous.total_credit,
      delta: creditDelta,
      inverted: true,
    },
  ]

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4">
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Comparativo de meses
        </h2>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {previous.month_label} → {current.month_label}
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const max = Math.max(row.cur, row.prev, 1)
          const curPct = (row.cur / max) * 100
          const prevPct = (row.prev / max) * 100

          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{row.label}</span>
                <DeltaChip value={row.delta} inverted={row.inverted} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-14 text-gray-400 dark:text-gray-500 flex-shrink-0 truncate">
                    {previous.month_label?.split(' ')[0]}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-500"
                      style={{ width: `${prevPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 w-20 text-right flex-shrink-0">
                    {formatCurrencyBRL(row.prev)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] w-14 text-gray-500 dark:text-gray-400 flex-shrink-0 truncate font-semibold">
                    {current.month_label?.split(' ')[0]}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--theme-accent)] transition-all duration-500"
                      style={{ width: `${curPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 w-20 text-right flex-shrink-0">
                    {formatCurrencyBRL(row.cur)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
