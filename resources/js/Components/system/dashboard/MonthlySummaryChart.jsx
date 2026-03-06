import React, { useState, useMemo } from 'react'
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

// ─── Vertical dashed-line plugin for selected month ───────────────────────────
// Module-level flag prevents double-registration on hot-reload.
// Fully null-safe on opts so it is harmless on Doughnut/Bar charts that
// do not configure this plugin.
let _vhlRegistered = false
function ensureVerticalHighlight() {
  if (_vhlRegistered) return
  _vhlRegistered = true
  ChartJS.register({
    id: 'verticalHighlight',
    beforeDraw(chart, _args, opts) {
      const idx = opts?.selectedIndex   // may be undefined on other chart types
      if (idx == null || idx < 0) return
      const { ctx, chartArea, scales } = chart
      if (!chartArea || !scales?.x) return
      const x = scales.x.getPixelForValue(idx)
      ctx.save()
      ctx.strokeStyle = opts?.lineColor ?? 'rgba(99,102,241,0.35)'
      ctx.lineWidth   = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.restore()
    },
  })
}
ensureVerticalHighlight()

// ─── Canvas gradient builder ──────────────────────────────────────────────────
function buildGradient(ctx, chartArea, hex, maxAlpha) {
  if (!ctx || !chartArea) return hex
  const g    = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  const base = hex?.startsWith('#') ? hex : '#6366f1'
  const a    = (v) => Math.round(v * 255).toString(16).padStart(2, '0')
  g.addColorStop(0,    base + a(maxAlpha))
  g.addColorStop(0.55, base + a(maxAlpha * 0.38))
  g.addColorStop(1,    base + a(0))
  return g
}

const isDark = () => document.documentElement.classList.contains('dark')

const MODES = [
  { value: 'both',    label: 'Ambos'   },
  { value: 'invoice', label: 'Crédito' },
  { value: 'debit',   label: 'Débito'  },
]

export default function MonthlySummaryChart({ data = [], onMonthClick, selectedMonthKey }) {
  const [mode, setMode] = useState('both')
  const { chartColors } = useThemeColors()

  const labels      = useMemo(() => data.map((d) => d.month_label), [data])
  const invoiceVals = useMemo(() => data.map((d) => Number(d.invoice_total || 0)), [data])
  const debitVals   = useMemo(() => data.map((d) => Number(d.debit_total   || 0)), [data])
  const monthKeys   = useMemo(() => data.map((d) => d.month_key), [data])

  const showInvoice    = mode !== 'debit'
  const showDebit      = mode !== 'invoice'
  const selectedIndex  = selectedMonthKey ? monthKeys.indexOf(selectedMonthKey) : -1
  const dark           = isDark()
  const primaryColor   = chartColors.primary?.startsWith('#') ? chartColors.primary : '#6366f1'
  const secondaryColor = dark ? '#60a5fa' : '#3b82f6'

  // ── Inline gradient plugin — runs BEFORE each draw, no extra update() call ──
  // Scoped to this <Line> instance via the plugins prop, never global.
  const gradientPlugin = useMemo(() => ({
    id: 'areaGradient',
    beforeDatasetsUpdate(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const d   = document.documentElement.classList.contains('dark')
      const alpha = d ? 0.27 : 0.19
      const key   = `${Math.round(chartArea.width)}x${Math.round(chartArea.height)}_${primaryColor}_${secondaryColor}_${d}`
      if (chart._gk !== key) {
        chart._gk = key
        chart._gradients = [
          buildGradient(ctx, chartArea, primaryColor,   alpha),
          buildGradient(ctx, chartArea, secondaryColor, alpha),
        ]
      }
      chart.data.datasets.forEach((ds, i) => {
        if (chart._gradients?.[i]) ds.backgroundColor = chart._gradients[i]
      })
    },
  }), [primaryColor, secondaryColor])

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div className="p-4 lg:p-6">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Gastos mensais
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ainda não há dados suficientes para exibir o gráfico.
        </p>
      </div>
    )
  }

  // ── Dataset factory ───────────────────────────────────────────────────────
  const makeDataset = (label, values, color, hidden) => ({
    label,
    data: values,
    hidden,
    tension: 0.42,
    fill: true,
    backgroundColor: color + '1a',  // overwritten by gradientPlugin before each draw
    borderColor: color,
    borderWidth: 2.5,
    pointRadius: values.map((_, i) => (i === selectedIndex ? 7 : 3)),
    pointHoverRadius: 8,
    pointBackgroundColor: values.map((_, i) =>
      i === selectedIndex ? color : (dark ? '#1e1e2e' : '#ffffff')
    ),
    pointBorderColor: color,
    pointBorderWidth: values.map((_, i) => (i === selectedIndex ? 2.5 : 1.5)),
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: dark ? '#1e1e2e' : '#ffffff',
    pointHoverBorderWidth: 2,
    spanGaps: true,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chartData = useMemo(() => ({
    labels,
    datasets: [
      makeDataset('Crédito', invoiceVals, primaryColor,   !showInvoice),
      makeDataset('Débito',  debitVals,   secondaryColor, !showDebit),
    ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [labels, invoiceVals, debitVals, primaryColor, secondaryColor, showInvoice, showDebit, selectedIndex, dark])

  // ── Options ───────────────────────────────────────────────────────────────
  const gridColor    = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const tickColor    = dark ? '#4b5563' : '#9ca3af'
  const tooltipBg    = dark ? 'rgba(15,15,23,0.96)'    : 'rgba(255,255,255,0.98)'
  const tooltipBdr   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const tooltipTitle = dark ? '#f9fafb' : '#111827'
  const tooltipBody  = dark ? '#9ca3af' : '#4b5563'

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick(_, elements) {
      if (!elements?.length || !onMonthClick) return
      const key = monthKeys[elements[0].index]
      if (key) onMonthClick(key)
    },
    animation: { duration: 600, easing: 'easeOutCubic' },
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
        titleFont: { size: 11, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          title: ([ctx]) => ctx.label,
          label: (ctx) => `  ${ctx.dataset.label}: ${formatCurrencyBRL(ctx.parsed.y || 0)}`,
          footer: () => (onMonthClick ? ['', '  💡 Clique para detalhar'] : []),
          footerColor: primaryColor,
          footerFont: { size: 11, style: 'italic' },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 11 }, maxRotation: 0, maxTicksLimit: 9 },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [selectedIndex, primaryColor, dark, onMonthClick, monthKeys, gridColor, tickColor, tooltipBg, tooltipBdr, tooltipTitle, tooltipBody])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            Gastos mensais
          </h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Últimos {data.length} meses
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                style={
                  mode === m.value
                    ? { backgroundColor: 'var(--theme-accent)', color: '#fff' }
                    : { color: 'var(--theme-primary)' }
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart canvas */}
      <div className="h-52 w-full sm:h-56 lg:h-64">
        <Line data={chartData} options={options} plugins={[gradientPlugin]} />
      </div>
    </div>
  )
}
