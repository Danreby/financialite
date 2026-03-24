import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const TYPE_CONFIG = {
  salary:     { label: 'Salário',      emoji: '💰', color: 'bg-emerald-500' },
  freelance:  { label: 'Freelance',    emoji: '💻', color: 'bg-blue-500' },
  investment: { label: 'Investimento', emoji: '📈', color: 'bg-violet-500' },
  rental:     { label: 'Aluguel',      emoji: '🏠', color: 'bg-amber-500' },
  benefit:    { label: 'Benefício',    emoji: '🎁', color: 'bg-pink-500' },
  pix:        { label: 'Pix',          emoji: '⚡', color: 'bg-teal-500' },
  other:      { label: 'Outros',       emoji: '📋', color: 'bg-gray-500' },
}

export default function ReceitasTypeBreakdown({ incomesByType = {}, totalMonthly = 0 }) {
  const entries = Object.entries(incomesByType)
    .map(([type, items]) => {
      const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
      return { type, items, total, count: items.length }
    })
    .sort((a, b) => b.total - a.total)

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl themed-card p-5 sm:p-6 flex items-center justify-center min-h-[180px]">
        <p className="text-sm text-gray-400">Nenhuma receita registrada</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl themed-card p-5 sm:p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Por Tipo
      </h3>

      <div className="flex flex-col gap-3">
        {entries.map(({ type, total, count }) => {
          const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
          const pct = totalMonthly > 0 ? (total / totalMonthly) * 100 : 0

          return (
            <div key={type} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{cfg.emoji}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">({count})</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0 ml-2">
                  {formatCurrencyBRL(total)}
                </span>
              </div>

              <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${cfg.color} transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>

              <div className="text-right mt-0.5">
                <span className="text-[10px] text-gray-400">{pct.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
