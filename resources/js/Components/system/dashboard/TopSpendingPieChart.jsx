import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, label: '', value: 0, share: 0, color: '' })

  useEffect(() => { setMounted(true) }, [])

  const externalTooltip = useCallback((context) => {
    const { chart, tooltip } = context
    if (tooltip.opacity === 0) {
      setTip(prev => ({ ...prev, visible: false }))
      return
    }
    const dp = tooltip.dataPoints?.[0]
    if (!dp) return
    const idx   = dp.dataIndex
    const value = Number(values[idx] || 0)
    const share = total > 0 ? Math.round((value / total) * 100) : 0
    const rect  = chart.canvas.getBoundingClientRect()
    setTip({
      visible: true,
      x: rect.left + tooltip.caretX,
      y: rect.top  + tooltip.caretY,
      label: labels[idx] || 'Sem categoria',
      value,
      share,
      color: colors[idx % colors.length] || '#888',
    })
  }, [values, labels, total, colors])

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

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltip,
      },
    },
  }), [externalTooltip])

  const donutKey = useMemo(() => labels.join('|') || 'empty', [labels])

  const recurringPct    = recurringSpending?.percentage    || 0
  const nonRecurringPct = nonRecurringSpending?.percentage || 0
  const showRecurring   = recurringPct > 0 || nonRecurringPct > 0

  return (
    <>
      <div className="flex flex-row gap-3 h-full">
        {/* Left: donut + recurring pills */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 justify-center">
          <div className="relative h-[148px] w-[148px]">
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
                <span className="text-[9px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Total
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums leading-tight text-center px-2">
                  {formatCurrencyBRL(total)}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {showRecurring && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.1 }}
              className="flex flex-col gap-1 w-full"
            >
              {recurringPct > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/25 dark:text-purple-300">
                  <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                  Recorr. {recurringPct.toFixed(0)}%
                </span>
              )}
              {nonRecurringPct > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-300">
                  <span className="w-1 h-1 rounded-full bg-orange-500 flex-shrink-0" />
                  Variáv. {nonRecurringPct.toFixed(0)}%
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Right: scrollable category list */}
        <ScrollArea maxHeightClassName="h-full" className="flex-1 min-w-0 pr-0.5">
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const color = colors[index % colors.length]
                const share = item.share || 0
                const iconEmoji = item.category_icon ? getIconEmoji(item.category_icon) : null

                return (
                  <motion.li
                    key={item.category_id ?? `none-${index}`}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="rounded-lg px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px]"
                        style={{ backgroundColor: color + (dark ? '28' : '18'), color }}
                      >
                        {iconEmoji || (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        )}
                      </div>
                      <span className="flex-1 min-w-0 text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                        {item.category_name || 'Sem categoria'}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 tabular-nums">
                        {formatCurrencyBRL(item.total || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pl-[26px]">
                      <div className="h-1 flex-1 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(share, 100)}%` }}
                          transition={{ duration: 0.45, delay: 0.08 + index * 0.04, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 tabular-nums w-6 text-right flex-shrink-0">
                        {share}%
                      </span>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </ScrollArea>
      </div>

      {/* Portal tooltip — renders at document.body, immune to any overflow/stacking context */}
      {mounted && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-150"
          style={{
            left: tip.x,
            top:  tip.y,
            opacity: tip.visible ? 1 : 0,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div className="rounded-xl border px-3 py-2 shadow-xl text-xs min-w-[140px] bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tip.color }} />
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]">{tip.label}</span>
            </div>
            <div className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatCurrencyBRL(tip.value)}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{tip.share}% do total</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
