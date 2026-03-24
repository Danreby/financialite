import React from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { getIconEmoji } from '@/Utils/categoryIcons'
import ScrollArea from '@/Components/common/ScrollArea'

const FALLBACK_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
]

export default function ResumoCategoryAverages({ averages = [] }) {
  return (
    <div className="themed-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
          Média por Categoria (últimos 4 meses)
        </h2>
      </div>

      {averages.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-400 dark:text-gray-500">Dados insuficientes para calcular médias</p>
        </div>
      ) : (
        <ScrollArea maxHeightClassName="max-h-[400px]" className="pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {averages.map((item, idx) => {
              const color = item.category_color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
              const isAbove = item.diff > 0
              const isBelow = item.diff < 0
              const isEqual = item.diff === 0

              return (
                <div
                  key={item.category_id ?? idx}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-[#0b0b0b] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {item.category_icon && (
                      <span className="text-base">{getIconEmoji(item.category_icon) || item.category_icon}</span>
                    )}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.category_name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Este mês</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrencyBRL(item.current_total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Média 4m</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {formatCurrencyBRL(item.average)}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Diferença</span>
                      <div className="flex items-center gap-1">
                        {isAbove && <TrendingUp className="w-3 h-3 text-red-500" />}
                        {isBelow && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                        {isEqual && <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={`text-xs font-semibold ${
                          isAbove ? 'text-red-500 dark:text-red-400' :
                          isBelow ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-gray-500'
                        }`}>
                          {isAbove ? '+' : ''}{item.diff_percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
