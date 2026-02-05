import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

export default function ExtratoSummary({ summary }) {
  if (!summary) return null

  const cards = [
    {
      label: 'Renda mensal',
      value: summary.total_income,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      icon: '💰',
    },
    {
      label: 'Total de gastos',
      value: summary.total_expenses,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800/40',
      icon: '📉',
    },
    {
      label: 'Gastos pagos',
      value: summary.total_paid,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800/40',
      icon: '✅',
    },
    {
      label: 'Gastos pendentes',
      value: summary.total_unpaid,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800/40',
      icon: '⏳',
    },
    {
      label: 'Saldo',
      value: summary.balance,
      color: summary.balance >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      bg: summary.balance >= 0
        ? 'bg-emerald-50 dark:bg-emerald-900/20'
        : 'bg-red-50 dark:bg-red-900/20',
      border: summary.balance >= 0
        ? 'border-emerald-200 dark:border-emerald-800/40'
        : 'border-red-200 dark:border-red-800/40',
      icon: '💵',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} p-3 sm:p-4`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{card.icon}</span>
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
              {card.label}
            </span>
          </div>
          <p className={`text-sm sm:text-lg font-bold ${card.color} truncate`}>
            {formatCurrencyBRL(card.value)}
          </p>
        </div>
      ))}
    </div>
  )
}
