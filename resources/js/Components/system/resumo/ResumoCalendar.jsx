import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, X } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDotColor(total, maxTotal) {
  if (total <= 0) return ''
  const ratio = maxTotal > 0 ? total / maxTotal : 0
  if (ratio > 0.75) return 'bg-red-500'
  if (ratio > 0.5) return 'bg-orange-400'
  if (ratio > 0.25) return 'bg-amber-400'
  return 'bg-emerald-400'
}

function getCellBg(total, maxTotal) {
  if (total <= 0) return ''
  const ratio = maxTotal > 0 ? total / maxTotal : 0
  if (ratio > 0.75) return 'bg-red-50 dark:bg-red-950/20'
  if (ratio > 0.5) return 'bg-orange-50 dark:bg-orange-950/20'
  if (ratio > 0.25) return 'bg-amber-50 dark:bg-amber-950/15'
  return 'bg-emerald-50 dark:bg-emerald-950/15'
}

export default function ResumoCalendar({ days = [], monthKey = '' }) {
  const [selectedDay, setSelectedDay] = useState(null)

  const maxDayTotal = useMemo(() => {
    return days.reduce((max, d) => Math.max(max, d.total || 0), 0)
  }, [days])

  const firstWeekday = days.length > 0 ? days[0].weekday : 0

  const paddingDays = Array.from({ length: firstWeekday }, (_, i) => ({
    key: `pad-${i}`,
    empty: true,
  }))

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    return days.find(d => d.date === selectedDay)
  }, [selectedDay, days])

  const handleDayClick = (day) => {
    if (day.count > 0) {
      setSelectedDay(prev => prev === day.date ? null : day.date)
    }
  }

  return (
    <div className="themed-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
            Calendário
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> Baixo
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Médio
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Alto
            </span>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-3 sm:px-4 pt-3">
        {WEEKDAY_LABELS.map(label => (
          <div
            key={label}
            className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 pb-2 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-3 sm:px-4 pb-3 sm:pb-4 gap-px">
        {paddingDays.map(p => (
          <div key={p.key} className="aspect-square" />
        ))}
        {days.map(day => {
          const hasTransactions = day.count > 0
          const isSelected = selectedDay === day.date
          const isToday = day.date === today
          const cellBg = hasTransactions ? getCellBg(day.total, maxDayTotal) : ''
          const dotColor = hasTransactions ? getDotColor(day.total, maxDayTotal) : ''

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={!hasTransactions}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center relative
                transition-all duration-150 text-center p-0.5
                ${hasTransactions
                  ? `cursor-pointer hover:scale-105 hover:shadow-sm ${cellBg} ${isSelected ? 'ring-2 ring-[var(--theme-accent)] shadow-md scale-105' : ''}`
                  : 'cursor-default'
                }
                ${isToday && !isSelected ? 'ring-1 ring-[var(--theme-accent)]/40' : ''}
              `}
            >
              <span className={`
                text-xs sm:text-sm leading-none
                ${isToday ? 'font-bold' : 'font-medium'}
                ${hasTransactions
                  ? 'text-gray-800 dark:text-gray-100'
                  : 'text-gray-300 dark:text-gray-700'
                }
                ${isToday && !hasTransactions ? 'text-[var(--theme-accent)]' : ''}
              `}>
                {day.day}
              </span>

              {/* Transaction indicators */}
              {hasTransactions && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {day.count <= 3 ? (
                    Array.from({ length: day.count }, (_, i) => (
                      <span key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${dotColor}`} />
                    ))
                  ) : (
                    <>
                      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${dotColor}`} />
                      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${dotColor}`} />
                      <span className="text-[7px] sm:text-[8px] font-bold text-gray-500 dark:text-gray-400 leading-none">
                        +{day.count - 2}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Amount on desktop */}
              {hasTransactions && (
                <span className="hidden sm:block text-[7px] sm:text-[8px] font-medium text-gray-500 dark:text-gray-400 mt-0.5 leading-none truncate max-w-full">
                  {formatCurrencyBRL(day.total)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDayData && selectedDayData.transactions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(selectedDayData.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedDayData.count} {selectedDayData.count === 1 ? 'transação' : 'transações'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500 dark:text-red-400">
                    {formatCurrencyBRL(selectedDayData.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-custom pr-1">
                {selectedDayData.transactions.map((t, idx) => (
                  <div
                    key={t.id ?? idx}
                    className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {t.category_icon && (
                        <span className="text-sm flex-shrink-0">{t.category_icon}</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {t.category_name && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{t.category_name}</span>
                          )}
                          {t.bank_name && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">{t.bank_name}</span>
                            </>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            t.type === 'credit'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {t.type === 'credit' ? 'Crédito' : 'Débito'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                      {formatCurrencyBRL(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
