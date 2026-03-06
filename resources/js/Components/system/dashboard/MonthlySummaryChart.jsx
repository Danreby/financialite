import React, { useRef, useCallback, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  LineController,
  BarController,
} from 'chart.js'
import { formatCurrencyBRL } from '@/Lib/formatters'
import useThemeColors from '@/Hooks/useThemeColors'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  LineController,
  BarController,
)

// Custom plugin: draw a subtle vertical highlight behind the selected month
const selectionPlugin = {
  id: 'columnHighlight',
  beforeDraw(chart, _args, opts) {
    const { selectedIndex } = opts
    if (selectedIndex == null || selectedIndex < 0) return
    const { ctx, chartArea, scales } = chart
    if (!chartArea || !scales.x) return
    const meta = chart.getDatasetMeta(0)
    const bar = meta.data?.[selectedIndex]
    if (!bar) return
    const barWidth = bar.width ?? 40
    const x = bar.x
    ctx.save()
    ctx.fillStyle = opts.highlightColor ?? 'rgba(99,102,241,0.08)'
    ctx.beginPath()
    ctx.roundRect
      ? ctx.roundRect(x - barWidth / 2 - 4, chartArea.top, barWidth + 8, chartArea.bottom - chartArea.top, 6)
      : ctx.rect(x - barWidth / 2 - 4, chartArea.top, barWidth + 8, chartArea.bottom - chartArea.top)
    ctx.fill()
    ctx.restore()
  },
}

ChartJS.register(selectionPlugin)

function buildGradient(ctx, chartArea, hex, alphaTop = 0.55, alphaBot = 0.04) {
  if (!chartArea) return hex
  const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  grad.addColorStop(0, hex + Math.round(alphaTop * 255).toString(16).padStart(2, '0'))
  grad.addColorStop(1, hex + Math.round(alphaBot * 255).toString(16).padStart(2, '0'))
  return grad
}

const MODES = [
  { value: 'both',    label: 'Ambos' },
  { value: 'invoice', label: 'Crédito' },
  { value: 'debit',   label: 'Débito' },
]

export default function MonthlySummaryChart({ data = [], onMonthClick, selectedMonthKey }) {
  const [mode, setMode] = React.useState('both')
  const { chartColors } = useThemeColors()
  const chartRef = useRef(null)

  const labels     = data.map((item) => item.month_label)
  const invoiceValues = data.map((item) => Number(item.invoice_total || 0))
  const debitValues   = data.map((item) => Number(item.debit_total   || 0))
  const monthKeys  = data.map((item) => item.month_key)

  const showInvoice = mode === 'both' || mode === 'invoice'
  const showDebit   = mode === 'both' || mode === 'debit'

  const selectedIndex = selectedMonthKey ? monthKeys.indexOf(selectedMonthKey) : -1

  // Rebuild gradients whenever chart area or theme changes
  const updateGradients = useCallback(() => {
    const chart = chartRef.current
    if (!chart || !chart.chartArea) return
    const ctx   = chart.ctx
    const area  = chart.chartArea
    const isDark = document.documentElement.classList.contains('dark')

    const primary   = chartColors.primary.replace('#', '') === chartColors.primary
      ? chartColors.primary
      : chartColors.primary

    const secondary = isDark ? '#3b82f6' : '#2563eb'

    chart.data.datasets.forEach((ds, i) => {
      const color = i === 0 ? primary : secondary
      ds.backgroundColor = buildGradient(ctx, area, color.startsWith('#') ? color : '#6366f1', 0.7, 0.12)
      ds.borderColor = color
    })
    chart.update('none')
  }, [chartColors])

  useEffect(() => {
    const timer = setTimeout(updateGradients, 50)
    return () => clearTimeout(timer)
  }, [updateGradients, mode, data])

  const handleChartClick = useCallback((event, elements) => {
    if (!elements || elements.length === 0 || !onMonthClick) return
    const idx            = elements[0].index
    const clickedMonthKey = monthKeys[idx]
    if (clickedMonthKey) onMonthClick(clickedMonthKey)
  }, [monthKeys, onMonthClick])

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl p-4">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Gastos mensais
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ainda não há dados suficientes para exibir o gráfico.
        </p>
      </div>
    )
  }

  const primaryColor   = chartColors.primary.startsWith('#') ? chartColors.primary : '#6366f1'
  const secondaryColor = document.documentElement.classList.contains('dark') ? '#3b82f6' : '#2563eb'

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Crédito',
        data: invoiceValues,
        backgroundColor: primaryColor + 'b3',
        borderColor: primaryColor,
        borderWidth: 1.5,
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: false,
        hoverBackgroundColor: primaryColor + 'e6',
        hoverBorderWidth: 2,
        hidden: !showInvoice,
        order: 2,
      },
      {
        type: 'bar',
        label: 'Débito',
        data: debitValues,
        backgroundColor: secondaryColor + 'b3',
        borderColor: secondaryColor,
        borderWidth: 1.5,
        borderRadius: { topLeft: 6, topRight: 6 },
        borderSkipped: false,
        hoverBackgroundColor: secondaryColor + 'e6',
        hoverBorderWidth: 2,
        hidden: !showDebit,
        order: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
      onComplete: updateGradients,
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      columnHighlight: {
        selectedIndex,
        highlightColor: primaryColor + '14',
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark')
          ? 'rgba(15,15,20,0.92)'
          : 'rgba(255,255,255,0.97)',
        borderColor: document.documentElement.classList.contains('dark')
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.07)',
        borderWidth: 1,
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563',
        padding: { top: 10, bottom: 10, left: 14, right: 14 },
        cornerRadius: 12,
        boxPadding: 5,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0
            return `  ${context.dataset.label}: ${formatCurrencyBRL(value)}`
          },
          footer: () => onMonthClick ? ['', '  💡 Clique para detalhar'] : [],
          footerColor: primaryColor,
          footerFont: { size: 11, style: 'italic' },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#9ca3af',
          font: { size: 11, weight: '500' },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark')
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.05)',
          drawTicks: false,
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
          padding: 8,
          maxTicksLimit: 5,
          callback: (value) => {
            if (value >= 1000) return `R$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
            return `R$${value}`
          },
        },
      },
    },
  }

  return (
    <div className="rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
            Gastos mensais
          </h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Últimos {data.length} meses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend dots */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            {showInvoice && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: primaryColor }} />
                Crédito
              </span>
            )}
            {showDebit && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: secondaryColor }} />
                Débito
              </span>
            )}
          </div>

          {/* Mode toggle */}
          <div className="inline-flex items-center gap-0.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                style={
                  mode === m.value
                    ? {
                        backgroundColor: 'var(--theme-accent)',
                        color: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                      }
                    : { color: 'var(--theme-primary)' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-56 w-full lg:h-64">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
