import { useCallback, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Card, EmptyState, MoneyText, SegmentedControl, Skeleton } from '@/Components/ui'
import useThemeColors from '@/Hooks/useThemeColors'
import { usePrefersReducedMotion } from '@/Hooks/useMediaQuery'
import { LineChart } from 'lucide-react'
import { creditOf, debitOf } from '@/Lib/dashboard'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const MODES = [
  { value: 'both', label: 'Ambos' },
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
]

const COMPACT = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

// Linha vertical no ponto ativo (cursor) e tracejada no mês escolhido.
const guidePlugin = {
  id: 'guides',
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea) return
    const line = (x, dash, color) => {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash(dash)
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.restore()
    }
    if (opts?.selectedIndex >= 0) line(scales.x.getPixelForValue(opts.selectedIndex), [4, 4], opts.selectedColor)
    const active = chart.tooltip?.getActiveElements?.() ?? []
    if (active.length) line(active[0].element.x, [], opts.cursorColor)
  },
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** Degradê da área: cor da série no topo, some até o chão do gráfico. */
function areaGradient(color, alpha) {
  return ({ chart }) => {
    const { ctx, chartArea } = chart
    if (!chartArea) return 'transparent'
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, hexToRgba(color, alpha))
    gradient.addColorStop(0.6, hexToRgba(color, alpha * 0.35))
    gradient.addColorStop(1, hexToRgba(color, 0))
    return gradient
  }
}

const shortMonth = (label = '') => label.split(' ')[0]

/**
 * "Gastos mensais": linhas suaves com área em degradê (como o Revenue
 * Forecast da referência), legenda, Ambos/Crédito/Débito e dica que segue o
 * cursor e encaixa no mês. Clicar num mês escolhe o mês de "Maiores gastos".
 */
export default function SpendingChart({ data = [], loading = false, selectedMonth, onMonthClick, className = '' }) {
  const [mode, setMode] = useState('both')
  const [tip, setTip] = useState(null)
  const { chartColors } = useThemeColors()
  const reducedMotion = usePrefersReducedMotion()

  const [creditColor, debitColor, neutralColor] = chartColors.series
  const labels = useMemo(() => data.map((m) => shortMonth(m.month_label)), [data])
  const credit = useMemo(() => data.map(creditOf), [data])
  const debit = useMemo(() => data.map(debitOf), [data])
  const selectedIndex = selectedMonth ? data.findIndex((m) => m.month_key === selectedMonth) : -1

  const series = useMemo(() => {
    const average = (values) => values.reduce((s, v) => s + v, 0) / (values.length || 1)
    const main = (label, values, color, fill = true) => ({ label, values, color, fill })
    if (mode === 'credit') return [main('Crédito', credit, creditColor), { label: 'Média do período', values: credit.map(() => average(credit)), color: neutralColor, dashed: true }]
    if (mode === 'debit') return [main('Débito', debit, debitColor), { label: 'Média do período', values: debit.map(() => average(debit)), color: neutralColor, dashed: true }]
    return [main('Crédito', credit, creditColor), main('Débito', debit, debitColor, false)]
  }, [mode, credit, debit, creditColor, debitColor, neutralColor])

  const chartData = useMemo(
    () => ({
      labels,
      datasets: series.map((s) => ({
        label: s.label,
        data: s.values,
        borderColor: s.color,
        borderWidth: s.dashed ? 1.5 : 2.5,
        borderDash: s.dashed ? [5, 5] : [],
        backgroundColor: s.fill ? areaGradient(s.color, 0.32) : 'transparent',
        fill: Boolean(s.fill),
        tension: 0.4,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHitRadius: 18,
        pointHoverRadius: s.dashed ? 0 : 5,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: s.color,
        pointHoverBorderColor: '#ffffff',
      })),
    }),
    [labels, series],
  )

  const external = useCallback(({ chart, tooltip }) => {
    if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
      setTip((prev) => (prev ? null : prev))
      return
    }
    const point = tooltip.dataPoints[0]
    const index = point.dataIndex
    const y = Math.min(...tooltip.dataPoints.map((p) => p.element.y))
    setTip((prev) =>
      prev && prev.index === index && prev.y === y ? prev : { index, x: point.element.x, y, width: chart.width },
    )
  }, [])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion ? false : { duration: 500, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 8 } },
      onClick: (_event, elements) => {
        const key = elements?.length ? data[elements[0].index]?.month_key : null
        if (key) onMonthClick?.(key)
      },
      onHover: (event, elements) => {
        if (event.native?.target) event.native.target.style.cursor = elements.length && onMonthClick ? 'pointer' : 'default'
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external },
        guides: { selectedIndex, selectedColor: hexToRgba(creditColor, 0.55), cursorColor: chartColors.grid.replace(/[\d.]+\)$/, '0.22)') },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: chartColors.tick, font: { size: 11 }, maxRotation: 0, padding: 8 },
        },
        y: {
          beginAtZero: true,
          grid: { color: chartColors.grid, drawTicks: false },
          border: { display: false },
          ticks: { color: chartColors.tick, font: { size: 11 }, padding: 10, maxTicksLimit: 5, callback: (v) => `R$ ${COMPACT.format(v)}` },
        },
      },
    }),
    [reducedMotion, data, onMonthClick, external, selectedIndex, creditColor, chartColors],
  )

  const legend = (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-secondary" aria-label="Legenda">
      {series.map((s) => (
        <li key={s.label} className="flex items-center gap-1.5">
          {s.dashed ? (
            <svg aria-hidden="true" width="14" height="2" viewBox="0 0 14 2">
              <line x1="0" y1="1" x2="14" y2="1" stroke={s.color} strokeWidth="2" strokeDasharray="3 2" />
            </svg>
          ) : (
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
          )}
          {s.label}
        </li>
      ))}
    </ul>
  )

  const tipMonth = tip ? data[tip.index] : null
  const tipAlign = tip ? (tip.x > tip.width * 0.7 ? '-100%' : tip.x < tip.width * 0.3 ? '0%' : '-50%') : '-50%'

  return (
    <Card
      title="Gastos mensais"
      subtitle={data.length ? `Últimos ${data.length} meses` : 'Evolução dos seus gastos'}
      actions={<SegmentedControl size="sm" label="Tipo de gasto no gráfico" options={MODES} value={mode} onChange={setMode} />}
      className={className}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <div className="h-64 lg:h-72">
          <span className="sr-only">Carregando gráfico</span>
          <Skeleton shape="block" className="h-full w-full" />
        </div>
      ) : !data.length ? (
        <EmptyState icon={LineChart} title="Sem gastos para mostrar" text="Registre transações para acompanhar a evolução mês a mês." />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-content-muted">Clique num mês para ver os maiores gastos dele.</p>
            {legend}
          </div>
          <div className="relative h-64 lg:h-72" onMouseLeave={() => setTip(null)}>
            <Line data={chartData} options={options} plugins={[guidePlugin]} aria-hidden="true" />
            {tipMonth && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 min-w-[11rem] rounded-chip border border-line bg-surface-raised px-3 py-2.5 text-xs shadow-pop transition-[left,top] duration-100 ease-out"
                style={{ left: tip.x, top: tip.y, transform: `translate(${tipAlign}, calc(-100% - 14px))` }}
              >
                <p className="mb-1.5 font-semibold text-content-primary">{tipMonth.month_label}</p>
                {series.filter((s) => !s.dashed).map((s) => (
                  <p key={s.label} className="flex items-center justify-between gap-4 py-0.5 text-content-secondary">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <MoneyText value={s.values[tip.index]} className="font-semibold" />
                  </p>
                ))}
                {mode === 'both' && (
                  <p className="mt-1 flex justify-between gap-4 border-t border-line pt-1.5 text-content-secondary">
                    Total <MoneyText value={credit[tip.index] + debit[tip.index]} className="font-semibold" />
                  </p>
                )}
              </div>
            )}
          </div>
          <table className="sr-only">
            <caption>Gastos por mês, no crédito e no débito</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Crédito</th>
                <th scope="col">Débito</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.month_key}>
                  <th scope="row">{m.month_label}</th>
                  <td><MoneyText value={credit[i]} /></td>
                  <td><MoneyText value={debit[i]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  )
}
