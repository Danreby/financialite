import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { motion, AnimatePresence } from 'framer-motion'
import { getIconEmoji } from '@/Utils/categoryIcons'
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
        borderColor: dark ? 'rgba(17,24,39,1)' : 'rgba(249,250,251,1)',
        borderWidth: values.length ? 2 : 0,
        hoverBorderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
        hoverBorderWidth: 3,
        cutout: '68%',
        borderRadius: values.length ? 4 : 0,
        spacing: values.length ? 3 : 0,
      },
    ],
  }), [labels, values, colors, dark])

  const tooltipBg  = dark ? 'rgba(15,15,23,0.96)' : 'rgba(255,255,255,0.98)'
  const tooltipBdr = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tooltipTxt = dark ? '#f9fafb' : '#111827'

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !!values.length,
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: tooltipTxt,
        bodyColor: dark ? '#9ca3af' : '#4b5563',
        padding: { top: 10, bottom: 10, left: 14, right: 14 },
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-44 w-44 mx-auto flex-shrink-0">
          <Doughnut key={donutKey} data={chartData} options={options} />

          <AnimatePresence mode="wait">
            <motion.div
              key={total}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
            >
              <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Total
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums">
                {formatCurrencyBRL(total)}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {showRecurring && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.1 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {recurringPct > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/25 dark:text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                Recorrentes {recurringPct.toFixed(0)}%
              </span>
            )}
            {nonRecurringPct > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                Variáveis {nonRecurringPct.toFixed(0)}%
              </span>
            )}
          </motion.div>
        )}
      </div>

      <ScrollArea maxHeightClassName="max-h-[240px]" className="w-full pr-1">
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const color = colors[index % colors.length]
              const share = item.share || 0
              const iconEmoji = item.category_icon ? getIconEmoji(item.category_icon) : null

              return (
                <motion.li
                  key={item.category_id ?? `none-${index}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, delay: index * 0.035 }}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: color + (dark ? '28' : '18'), color }}
                  >
                    {iconEmoji || (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5 gap-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                        {item.category_name || 'Sem categoria'}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 tabular-nums">
                        {formatCurrencyBRL(item.total || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(share, 100)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + index * 0.04, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums w-7 text-right flex-shrink-0">
                        {share}%
                      </span>
                    </div>
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
