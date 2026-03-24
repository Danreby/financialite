import React from 'react'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'

export default function ResumoSummaryCards({ summary = {}, isLoading = false }) {
  const { total_income = 0, total_expenses = 0, balance = 0 } = summary

  const cards = [
    {
      title: 'Receitas',
      value: total_income,
      icon: TrendingUp,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      title: 'Despesas',
      value: total_expenses,
      icon: TrendingDown,
      colorClass: 'text-red-600 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
    },
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      colorClass: balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400',
      bgClass: balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20',
      iconBg: balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-red-100 dark:bg-red-900/40',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-2xl themed-card p-4 sm:p-5 transition-all ${isLoading ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.colorClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  {card.title}
                </p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold mt-0.5 ${card.colorClass}`}>
                  {formatCurrencyBRL(card.value)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
