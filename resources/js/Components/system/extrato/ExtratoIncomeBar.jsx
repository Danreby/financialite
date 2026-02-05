import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const TYPE_CONFIG = {
  salary:     { icon: '💼', label: 'Salário' },
  freelance:  { icon: '💻', label: 'Freelance' },
  investment: { icon: '📈', label: 'Investimento' },
  rental:     { icon: '🏠', label: 'Aluguel' },
  benefit:    { icon: '🎁', label: 'Benefício' },
  other:      { icon: '💰', label: 'Outro' },
}

export default function ExtratoIncomeBar({ incomes = [] }) {
  if (!incomes.length) return null

  const total = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0)

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 sm:p-4 dark:border-emerald-800/40 dark:from-emerald-900/10 dark:to-teal-900/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
            Rendas ativas
          </h4>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            {formatCurrencyBRL(total)}
            <span className="text-xs font-normal text-emerald-600/70 dark:text-emerald-400/60 ml-1">/mês</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {incomes.map((income) => {
            const config = TYPE_CONFIG[income.type] || TYPE_CONFIG.other
            return (
              <div
                key={income.id}
                className="flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30"
              >
                <span>{config.icon}</span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{income.title}</span>
                <span className="font-bold">{formatCurrencyBRL(income.amount)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
