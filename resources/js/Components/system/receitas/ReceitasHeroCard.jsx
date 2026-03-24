import React from 'react'
import { TrendingUp, Plus, Activity } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'

export default function ReceitasHeroCard({ totalMonthly = 0, activeCount = 0, inactiveCount = 0, onAddNew }) {
  return (
    <div className="relative overflow-hidden rounded-2xl themed-card p-5 sm:p-6 lg:p-8">
      <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 opacity-[0.04] dark:opacity-[0.06] pointer-events-none">
        <TrendingUp className="w-full h-full" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Renda mensal total
            </p>
          </div>

          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrencyBRL(totalMonthly)}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {activeCount} ativa{activeCount !== 1 ? 's' : ''}
              </span>
            </div>
            {inactiveCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {inactiveCount} inativa{inactiveCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <PrimaryButton
          onClick={onAddNew}
          className="text-white !text-xs sm:!text-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Renda
        </PrimaryButton>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-50" />
    </div>
  )
}
