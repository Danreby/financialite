import React from 'react'
import { DollarSign } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import ScrollArea from '@/Components/common/ScrollArea'

const TYPE_CONFIG = {
  salary:     { icon: '💼', label: 'Salário' },
  freelance:  { icon: '💻', label: 'Freelance' },
  investment: { icon: '📈', label: 'Investimento' },
  rental:     { icon: '🏠', label: 'Aluguel' },
  benefit:    { icon: '🎁', label: 'Benefício' },
  pix:        { icon: '⚡', label: 'Pix' },
  other:      { icon: '💰', label: 'Outro' },
}

export default function ResumoIncomeSection({ incomes = [] }) {
  const totalIncome = incomes.reduce((acc, i) => acc + (i.amount || 0), 0)

  return (
    <div className="themed-card rounded-2xl p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          Receitas do Mês
        </h2>
        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrencyBRL(totalIncome)}
        </span>
      </div>

      {incomes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma receita registrada</p>
        </div>
      ) : (
        <ScrollArea maxHeightClassName="max-h-[320px]" className="flex-1 space-y-2 pr-1">
          {incomes.map((income, idx) => {
            const config = TYPE_CONFIG[income.type] || TYPE_CONFIG.other
            return (
              <div
                key={income.id ?? idx}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-lg">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {income.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {income.type_label}
                    </span>
                    {income.payment_day_label && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {income.payment_day_label}
                        </span>
                      </>
                    )}
                    {(income.bank_name || income.bank_account_name) && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          🏦 {income.bank_name || income.bank_account_name}
                        </span>
                      </>
                    )}
                    {!income.is_recurring && (
                      <span className="ml-1 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        Avulsa
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {formatCurrencyBRL(income.amount)}
                </span>
              </div>
            )
          })}
        </ScrollArea>
      )}
    </div>
  )
}
