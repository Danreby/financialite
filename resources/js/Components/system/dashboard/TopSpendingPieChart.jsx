import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { motion, AnimatePresence } from 'framer-motion'
import CategoryBadge from '@/Components/common/CategoryBadge'
import ScrollArea from '@/Components/common/ScrollArea'
import { formatCurrencyBRL } from '@/Lib/formatters'

ChartJS.register(ArcElement, Tooltip)

const isDark = () => document.documentElement.classList.contains('dark')

export default function TopSpendingPieChart({
  labels = [],
  values = [],
  total = 0,
  colors = [],
  items = [],
  recurringSpending = {},
  nonRecurringSpending = {},
}) {
  const dark = isDark()

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        data: values.length ? values : [1],
        backgroundColor: values.length
          ? labels.map((_, i) => colors[i % colors.length])
          : [dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'],
        borderColor: 'transparent',
        borderWidth: 0,
        hoverBorderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
        hoverBorderWidth: 2,
        cutout: '70%',
        borderRadius: values.length ? 3 : 0,
        spacing: values.length ? 2 : 0,
      },
    ],
  }), [labels, values, colors, dark])

  const tooltipBg  = dark ? 'rgba(15,15,23,0.96)' : 'rgba(255,255,255,0.98)'
  const tooltipBdr = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tooltipTxt = dark ? '#f9fafb' : '#111827'

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 550, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !!values.length,
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: tooltipTxt,
        bodyColor: dark ? '#9ca3af' : '#4b5563',
        padding: { top: 9, bottom: 9, left: 13, right: 15 },
        cornerRadius: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => {
            const v     = Number(ctx.parsed || 0)
            const lbl   = ctx.label || 'Sem categoria'
            const share = total > 0 ? Math.round((v / total) * 100) : 0
            return `  ${lbl}: ${formatCurrencyBRL(v)} (${share}%)`
          },
        },
      },
    },
  }), [total, dark, tooltipBg, tooltipBdr, tooltipTxt, values.length])

  const donutKey = useMemo(() => labels.join('|') || 'empty', [labels])

  const recurringPct    = recurringSpending?.percentage    || 0
  const nonRecurringPct = nonRecurringSpending?.percentage || 0
  const showRecurring   = recurringPct > 0 || nonRecurringPct > 0

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex flex-col items-center gap-3 lg:w-[190px] lg:flex-shrink-0">
        <div className="relative h-44 w-full max-w-[180px] lg:h-48">
          <Doughnut key={donutKey} data={chartData} options={options} />

          <AnimatePresence mode="wait">
            <motion.div
              key={total}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {formatCurrencyBRL(total)}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {showRecurring && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full space-y-2 pt-2 border-t border-gray-200 dark:border-white/[0.07]"
          >
            <RecurringRow
              color="bg-purple-500"
              label="Recorrentes"
              pct={recurringPct}
            />
            <RecurringRow
              color="bg-orange-500"
              label="Não recorrentes"
              pct={nonRecurringPct}
            />
          </motion.div>
        )}
      </div>

      <ScrollArea maxHeightClassName="max-h-[280px]" className="flex-1 min-w-0 pr-1">
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const color = colors[index % colors.length]
              const share = item.share || 0
              return (
                <motion.li
                  key={item.category_id ?? `none-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <CategoryBadge
                        name={item.category_name || 'Sem categoria'}
                        icon={item.category_icon}
                        color={item.category_color}
                        size="sm"
                        className="max-w-[140px] truncate"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px]">
                      <span className="text-gray-400 dark:text-gray-500 tabular-nums">
                        {share}%
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatCurrencyBRL(item.total || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(share, 100)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + index * 0.04, ease: 'easeOut' }}
                    />
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </ScrollArea>
    </div>
  )
}

function RecurringRow({ color, label, pct }) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} aria-hidden />
        <span className="text-gray-600 dark:text-gray-400 truncate">{label}</span>
      </div>
      <span className="font-medium text-gray-800 dark:text-gray-200 tabular-nums flex-shrink-0">
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}
