import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { formatCurrencyBRL } from '@/Lib/formatters'
import useThemeColors from '@/Hooks/useThemeColors'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function MonthlySummaryChart({ data = [], onMonthClick, selectedMonthKey }) {
  const [mode, setMode] = React.useState('both')
  const { colors: themeColors, chartColors } = useThemeColors()

  const labels = data.map((item) => item.month_label)
  const invoiceValues = data.map((item) => Number(item.invoice_total || 0))
  const debitValues = data.map((item) => Number(item.debit_total || 0))
  const monthKeys = data.map((item) => item.month_key)

  const showInvoice = mode === 'both' || mode === 'invoice'
  const showDebit = mode === 'both' || mode === 'debit'

  const handleChartClick = React.useCallback((event, elements) => {
    if (!elements || elements.length === 0 || !onMonthClick) return
    
    const index = elements[0].index
    const clickedMonthKey = monthKeys[index]
    
    if (clickedMonthKey) {
      onMonthClick(clickedMonthKey)
    }
  }, [monthKeys, onMonthClick])

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl themed-card p-4 shadow-md ring-1 ring-black/5 dark:ring-black/30">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Gastos mensais
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ainda não há dados suficientes para exibir o gráfico.
        </p>
      </div>
    )
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Crédito',
        data: invoiceValues,
        tension: 0.35,
        fill: true,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryBg,
        pointRadius: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? 6 : 4
        },
        pointHoverRadius: 6,
        pointBackgroundColor: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? chartColors.primary : '#ffffff'
        },
        pointBorderColor: chartColors.primaryBorder,
        pointBorderWidth: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? 3 : 2
        },
        hidden: !showInvoice,
      },
      {
        label: 'Débito',
        data: debitValues,
        tension: 0.35,
        fill: true,
        borderColor: chartColors.secondary,
        backgroundColor: chartColors.secondaryBg,
        pointRadius: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? 6 : 4
        },
        pointHoverRadius: 6,
        pointBackgroundColor: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? chartColors.secondary : '#ffffff'
        },
        pointBorderColor: chartColors.secondary,
        pointBorderWidth: (context) => {
          const index = context.dataIndex
          return selectedMonthKey === monthKeys[index] ? 3 : 2
        },
        hidden: !showDebit,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0
            return `${context.dataset.label}: ${formatCurrencyBRL(value)}`
          },
          footer: () => {
            return onMonthClick ? '\n💡 Clique para ver detalhes do mês' : ''
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          callback: (value) => {
            return formatCurrencyBRL(value)
          },
        },
      },
    },
  }

  return (
    <div className="rounded-2xl themed-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
          Gastos mensais
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Últimos 6 meses
          </span>
          <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-[11px] dark:bg-gray-900/50">
            <button
              type="button"
              onClick={() => setMode('both')}
              className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                mode === 'both'
                  ? 'themed-pill-active'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setMode('invoice')}
              className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                mode === 'invoice'
                  ? 'themed-pill-active'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              Crédito
            </button>
            <button
              type="button"
              onClick={() => setMode('debit')}
              className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                mode === 'debit'
                  ? 'themed-pill-active'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              Débito
            </button>
          </div>
        </div>
      </div>

      <div className="h-56 w-full lg:h-64">
         <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
