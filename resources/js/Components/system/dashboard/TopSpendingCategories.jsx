import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import TopSpendingPieChart from '@/Components/system/dashboard/TopSpendingPieChart'
import useThemeColors from '@/Hooks/useThemeColors'

export default function TopSpendingCategories({ data = [], label = 'Mês vigente', recurringSpending = {}, nonRecurringSpending = {} }) {
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
    <div className="rounded-2xl themed-card bg-white p-4 dark:bg-[#0b0b0b]">
      <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Maiores Gastos — {label}
      </h2>

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
