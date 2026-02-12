import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import TopSpendingPieChart from '@/Components/system/dashboard/TopSpendingPieChart'
import LoadingOverlay from '@/Components/common/LoadingOverlay'
import useThemeColors from '@/Hooks/useThemeColors'

export default function TopSpendingCategories({
  data = [],
  label = 'Mês vigente',
  recurringSpending = {},
  nonRecurringSpending = {},
  isLoading = false,
  hasSelection = false,
  onClearSelection,
}) {
  const { chartColors } = useThemeColors()
  const topSix = Array.isArray(data)
    ? [...data].sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 6)
    : []

  const totalTop = topSix.reduce((acc, item) => acc + Number(item.total || 0), 0)

  const prepared = topSix.map((item) => {
    const share = totalTop > 0 ? Math.round((Number(item.total || 0) / totalTop) * 100) : 0
    return {
      ...item,
      share,
    }
  })

  const colors = chartColors.palette

  return (
    <div className="relative rounded-2xl themed-card p-4 overflow-hidden">
      <LoadingOverlay visible={isLoading} message="Carregando..." />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
          Maiores Gastos — {label}
        </h2>
        {hasSelection && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs px-2 py-1 rounded-md text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            aria-label="Limpar seleção"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {(!prepared || prepared.length === 0) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ainda não há gastos para este mês.
        </p>
      )}

      {prepared && prepared.length > 0 && (
        <TopSpendingPieChart
          labels={prepared.map((item) => item.category_name || 'Sem categoria')}
          values={prepared.map((item) => Number(item.total || 0))}
          total={totalTop}
          colors={colors}
          items={prepared}
          recurringSpending={recurringSpending}
          nonRecurringSpending={nonRecurringSpending}
        />
      )}
    </div>
  )
}
