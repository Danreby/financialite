import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { formatCurrencyBRL } from '@/Lib/formatters'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function TopSpendingPieChart({
  labels = [],
  values = [],
  total = 0,
  colors = [],
  items = [],
}) {
  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, index) => colors[index % colors.length]),
        borderColor: 'rgba(15, 23, 42, 0.2)',
        borderWidth: 1,
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
      <div className="h-52 lg:h-60">
        <Pie data={chartData} options={options} />
      </div>
      <ul className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {items.map((item, index) => (
          <li key={item.category_id ?? 'none'} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden
              />
              <span className="font-medium text-gray-900 dark:text-gray-200 truncate">
                {item.category_name || 'Sem categoria'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span className="text-[11px] uppercase tracking-wide">{item.share || 0}%</span>
              <span>{formatCurrencyBRL(item.total || 0)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
