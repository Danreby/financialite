import React, { useRef, useCallback, useEffect } from 'react'
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
)

// ─── Vertical highlight plugin for selected month ────────────────────────────
const verticalHighlightPlugin = {
  id: 'verticalHighlight',
  beforeDraw(chart, _args, opts) {
    const { selectedIndex, lineColor } = opts
    if (selectedIndex == null || selectedIndex < 0) return
    const { ctx, chartArea, scales } = chart
    if (!chartArea || !scales.x) return
    const xPos = scales.x.getPixelForValue(selectedIndex)
    ctx.save()
    ctx.strokeStyle = lineColor ?? 'rgba(99,102,241,0.35)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(xPos, chartArea.top)
    ctx.lineTo(xPos, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}
ChartJS.register(verticalHighlightPlugin)

// ─── Area gradient builder ────────────────────────────────────────────────────
function buildAreaGradient(ctx, chartArea, hexColor, maxAlpha = 0.3) {
  if (!ctx || !chartArea) return hexColor
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  const hex = hexColor.startsWith('#') ? hexColor : '#6366f1'
  const toHex = (a) => Math.round(a * 255).toString(16).padStart(2, '0')
  gradient.addColorStop(0,   hex + toHex(maxAlpha))
  gradient.addColorStop(0.6, hex + toHex(maxAlpha * 0.35))
  gradient.addColorStop(1,   hex + toHex(0))
  return gradient
}

const isDarkMode = () => document.documentElement.classList.contains('dark')

const MODES = [
  { value: 'both',    label: 'Ambos' },
  { value: 'invoice', label: 'Crédito' },
  { value: 'debit',   label: 'Débito' },
]

export default function MonthlySummaryChart({ data = [], onMonthClick, selectedMonthKey }) {
  const [mode, setMode] = React.useState('both')
  const { chartColors } = useThemeColors()
  const chartRef = useRef(null)

  const labels      = data.map((d) => d.month_label)
  const invoiceVals = data.map((d) => Number(d.invoice_total || 0))
  const debitVals   = data.map((d) => Number(d.debit_total   || 0))
  const monthKeys   = data.map((d) => d.month_key)

  const showInvoice = mode === 'both' || mode === 'invoice'
  const showDebit   = mode === 'both' || mode === 'debit'
  const selectedIndex = selectedMonthKey ? monthKeys.indexOf(selectedMonthKey) : -1

  const isDark       = isDarkMode()
  const primaryColor  = chartColors.primary?.startsWith('#') ? chartColors.primary : '#6366f1'
  const secondaryColor = isDark ? '#60a5fa' : '#3b82f6'

  // Re-apply canvas gradients after chart renders
  const applyGradients = useCallback(() => {
    const chart = chartRef.current
    if (!chart?.chartArea) return
    chart.data.datasets.forEach((ds, i) => {
      ds.backgroundColor = buildAreaGradient(
        chart.ctx,
        chart.chartArea,
        i === 0 ? primaryColor : secondaryColor,
        isDark ? 0.28 : 0.22,
      )
    })
    chart.update('none')
  }, [primaryColor, secondaryColor, isDark])

  useEffect(() => {
    const id = setTimeout(applyGradients, 60)
    return () => clearTimeout(id)
  }, [applyGradients, mode, data])

  const handleClick = useCallback((_, elements) => {
    if (!elements?.length || !onMonthClick) return
    const key = monthKeys[elements[0].index]
    if (key) onMonthClick(key)
  }, [monthKeys, onMonthClick])

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!data.length) {
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

  // ── Chart data ───────────────────────────────────────────────────────────────
  const makeDataset = (label, values, color, hidden) => ({
    label,
    data: values,
    hidden,
    tension: 0.42,
    fill: true,
    backgroundColor: color + '1a',   // placeholder; replaced by applyGradients
    borderColor: color,
    borderWidth: 2.5,
    pointRadius: values.map((_, i) => (i === selectedIndex ? 7 : 3.5)),
    pointHoverRadius: 7,
    pointBackgroundColor: values.map((_, i) =>
      i === selectedIndex ? color : (isDark ? '#1f2937' : '#ffffff')
    ),
    pointBorderColor: color,
    pointBorderWidth: values.map((_, i) => (i === selectedIndex ? 2.5 : 1.5)),
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: isDark ? '#1f2937' : '#ffffff',
    pointHoverBorderWidth: 2,
    order: 1,
  })

  const chartData = {
    labels,
    datasets: [
      makeDataset('Crédito', invoiceVals, primaryColor,   !showInvoice),
      makeDataset('Débito',  debitVals,   secondaryColor, !showDebit),
    ],
  }

  // ── Options ──────────────────────────────────────────────────────────────────
  const gridColor   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tickColor   = isDark ? '#6b7280' : '#9ca3af'
  const tooltipBg   = isDark ? 'rgba(12,12,18,0.94)' : 'rgba(255,255,255,0.97)'
  const tooltipBdr  = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
  const tooltipTitle= isDark ? '#f9fafb' : '#111827'
  const tooltipBody = isDark ? '#9ca3af' : '#4b5563'

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    animation: {
      duration: 700,
      easing: 'easeOutCubic',
      onComplete: applyGradients,
    },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      verticalHighlight: {
        selectedIndex,
        lineColor: primaryColor + '55',
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        padding: { top: 10, bottom: 10, left: 14, right: 16 },
        cornerRadius: 12,
        boxPadding: 6,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          title: ([ctx]) => ctx.label,
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrencyBRL(ctx.parsed.y || 0)}`,
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
        ticks: { color: tickColor, font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        grid: { color: gridColor, drawTicks: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          padding: 8,
          maxTicksLimit: 5,
          callback: (v) =>
            v >= 1000
              ? `R$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
              : `R$${v}`,
        },
      },
    },
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl p-4">
      {/* Header */}
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
          {/* Inline legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            {showInvoice && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                Crédito
              </span>
            )}
            {showDebit && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                Débito
              </span>
            )}
          </div>

          {/* Mode toggle pill */}
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
                        boxShadow: '0 1px 6px rgba(0,0,0,0.20)',
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

      {/* Chart */}
      <div className="h-56 w-full lg:h-64">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
