import React, { useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

export default function ExtratoSpendingOverview({ summary, transactions = [] }) {
  const stats = useMemo(() => {
    if (!summary) return null

    const flat = transactions.flatMap((group) => group.transactions || [])
    const totalTxCount = flat.length
    const paidCount = flat.filter((t) => t.status === 'paid').length
    const unpaidCount = flat.filter((t) => t.status !== 'paid').length
    const creditCount = flat.filter((t) => t.type === 'credit').length
    const debitCount = flat.filter((t) => t.type === 'debit').length
    const recurringCount = flat.filter((t) => t.is_recurring).length

    const dailyAvg = (() => {
      if (!summary.start_date || !summary.end_date) return 0
      const start = new Date(summary.start_date)
      const end = new Date(summary.end_date)
      const days = Math.max(
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
        1
      )
      return summary.total_expenses / days
    })()

    const savingsRate = summary.total_income > 0
      ? ((summary.total_income - summary.total_paid) / summary.total_income) * 100
      : 0

    return {
      totalTxCount,
      paidCount,
      unpaidCount,
      creditCount,
      debitCount,
      recurringCount,
      dailyAvg,
      savingsRate: Math.max(savingsRate, 0),
    }
  }, [summary, transactions])

  if (!stats || !summary) return null

  const incomeVsExpense = summary.total_income > 0
    ? Math.min((summary.total_expenses / summary.total_income) * 100, 100)
    : 0

  return (
    <div className="rounded-xl p-3 sm:p-4 shadow-sm themed-card">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Visão geral do período
      </h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            Receita vs Despesas
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            {incomeVsExpense.toFixed(0)}% usado
          </span>
        </div>
        <div className="h-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              incomeVsExpense > 90
                ? 'bg-red-500'
                : incomeVsExpense > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${incomeVsExpense}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBRL(summary.total_income)}
          </span>
          <span className="text-[10px] text-red-500 dark:text-red-400">
            {formatCurrencyBRL(summary.total_expenses)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatPill
          label="Média diária"
          value={formatCurrencyBRL(stats.dailyAvg)}
          icon="📊"
        />
        <StatPill
          label="Taxa poupança"
          value={`${stats.savingsRate.toFixed(1)}%`}
          icon="🏦"
          tone={stats.savingsRate > 20 ? 'positive' : stats.savingsRate > 0 ? 'neutral' : 'negative'}
        />
        <StatPill
          label="Transações"
          value={String(stats.totalTxCount)}
          icon="🔢"
        />
        <StatPill
          label="Crédito / Débito"
          value={`${stats.creditCount} / ${stats.debitCount}`}
          icon="💳"
        />
        <StatPill
          label="Pagos / Pendentes"
          value={`${stats.paidCount} / ${stats.unpaidCount}`}
          icon="✅"
        />
        <StatPill
          label="Recorrentes"
          value={String(stats.recurringCount)}
          icon="🔄"
        />
      </div>
    </div>
  )
}

function StatPill({ label, value, icon, tone = 'neutral' }) {
  const toneClass = {
    positive: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40',
    negative: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',
    neutral: 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800',
  }[tone]

  return (
    <div className={`rounded-lg border p-2 ${toneClass}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{label}</span>
      </div>
      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
