import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import CategoryBadge from '@/Components/common/CategoryBadge'
import { formatCurrencyBRL } from '@/Lib/formatters'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function TopSpendingPieChart({
  labels = [],
  values = [],
  total = 0,
  colors = [],
  items = [],
  recurringSpending = {},
  nonRecurringSpending = {},
}) {
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, index) => colors[index % colors.length]),
        borderColor: 'rgba(15, 23, 42, 0.2)',
        borderWidth: 1,
        cutout: '65%',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.parsed || 0)
            const labelText = context.label || 'Sem categoria'
            const share = total > 0 ? Math.round((value / total) * 100) : 0
            return `${labelText}: ${formatCurrencyBRL(value)} (${share}%)`
          },
        },
      },
    },
  }

  const recurringPercentage = recurringSpending?.percentage || 0
  const nonRecurringPercentage = nonRecurringSpending?.percentage || 0

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <div className="h-52 lg:h-60 relative">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrencyBRL(total)}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.category_id ?? 'none'} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors[index % colors.length] }}
                  aria-hidden
                />
                <CategoryBadge
                  name={item.category_name || 'Sem categoria'}
                  icon={item.category_icon}
                  color={item.category_color}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 flex-shrink-0">
                <span className="text-[11px] uppercase tracking-wide">{item.share || 0}%</span>
                <span>{formatCurrencyBRL(item.total || 0)}</span>
              </div>
            </li>
          ))}
        </ul>

        {(recurringPercentage > 0 || nonRecurringPercentage > 0) && (
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
              Tipo de gasto
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" aria-hidden />
                  <span className="text-gray-700 dark:text-gray-300">Recorrentes</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {recurringPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                  <span className="text-gray-700 dark:text-gray-300">Não recorrentes</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {nonRecurringPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
