import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

export default function MonthlySummaryChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Gastos mensais
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ainda não há dados suficientes para exibir o gráfico.
        </p>
      </div>
    )
  }

  const values = data.map((item) => Number(item.expenses_paid || 0))
  const maxValue = Math.max(...values, 1)
  const minValue = 0

  const points = values.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100
    const normalized = (Number(value) - minValue) / (maxValue - minValue || 1)
    const y = 100 - normalized * 80 - 5
    return `${x},${y}`
  })

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Gastos mensais
        </h2>
        <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Últimos 6 meses
        </span>
      </div>

      <div className="h-40 w-full">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-rose-500 dark:text-rose-400"
            points={points.join(' ')}
          />

          {values.map((value, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * 100
            const normalized = (Number(value) - minValue) / (maxValue - minValue || 1)
            const y = 100 - normalized * 80 - 5

            return (
              <g key={data[index]?.month_key || index}>
                <circle
                  cx={x}
                  cy={y}
                  r={1.6}
                  className="fill-white dark:fill-[#0b0b0b] stroke-rose-500 dark:stroke-rose-400"
                >
                  <title>
                    {`${data[index]?.month_label || ''} - ${formatCurrencyBRL(value)}`}
                  </title>
                </circle>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400" />
          <span>Total gasto (débitos pagos) por mês</span>
        </div>
      </div>
    </div>
  )
}
