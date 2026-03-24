import React, { useState, useMemo } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getIntensityClass(total, maxTotal) {
  if (total <= 0) return ''
  const ratio = maxTotal > 0 ? total / maxTotal : 0
  if (ratio > 0.75) return 'bg-red-200 dark:bg-red-900/50'
  if (ratio > 0.5) return 'bg-orange-200 dark:bg-orange-900/40'
  if (ratio > 0.25) return 'bg-amber-200 dark:bg-amber-900/40'
  return 'bg-yellow-100 dark:bg-yellow-900/30'
}

export default function ResumoCalendar({ days = [], monthKey = '' }) {
  const [expandedDay, setExpandedDay] = useState(null)

  const maxDayTotal = useMemo(() => {
    return days.reduce((max, d) => Math.max(max, d.total || 0), 0)
  }, [days])

  const firstWeekday = days.length > 0 ? days[0].weekday : 0

  const paddingDays = Array.from({ length: firstWeekday }, (_, i) => ({
    key: `pad-${i}`,
    empty: true,
  }))

  const toggleDay = (dateKey) => {
    setExpandedDay(prev => prev === dateKey ? null : dateKey)
  }

  const expandedDayData = useMemo(() => {
    if (!expandedDay) return null
    return days.find(d => d.date === expandedDay)
  }, [expandedDay, days])

  return (
    <div className="themed-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
          Calendário de Movimentações
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30" /> Baixo
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-orange-200 dark:bg-orange-900/40" /> Médio
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-200 dark:bg-red-900/50" /> Alto
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {paddingDays.map(p => (
          <div key={p.key} className="aspect-square" />
        ))}
        {days.map(day => {
          const hasTransactions = day.count > 0
          const isExpanded = expandedDay === day.date
          const intensityClass = hasTransactions ? getIntensityClass(day.total, maxDayTotal) : ''

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => hasTransactions && toggleDay(day.date)}
              disabled={!hasTransactions}
              className={`
                aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center relative
                transition-all duration-200 text-center
                ${hasTransactions
                  ? `cursor-pointer hover:ring-2 hover:ring-[var(--theme-accent)]/50 ${intensityClass} ${isExpanded ? 'ring-2 ring-[var(--theme-accent)]' : ''}`
                  : 'bg-gray-50 dark:bg-gray-900/20 cursor-default'
                }
              `}
            >
              <span className={`text-xs sm:text-sm font-medium ${
                hasTransactions ? 'text-gray-900 dark:text-gray-100' : 'text-gray-300 dark:text-gray-600'
              }`}>
                {day.day}
              </span>
              {hasTransactions && (
                <span className="text-[8px] sm:text-[10px] font-medium text-gray-600 dark:text-gray-300 mt-0.5 hidden sm:block">
                  {day.count}
                </span>
              )}
              {hasTransactions && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[var(--theme-accent)] sm:hidden" />
              )}
            </button>
          )
        })}
      </div>

      {expandedDayData && expandedDayData.transactions.length > 0 && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
              {new Date(expandedDayData.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-500 dark:text-red-400">
                {formatCurrencyBRL(expandedDayData.total)}
              </span>
              <button
                type="button"
                onClick={() => setExpandedDay(null)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronUp className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-custom pr-1">
            {expandedDayData.transactions.map((t, idx) => (
              <div
                key={t.id ?? idx}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900/30"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {t.category_icon && (
                    <span className="text-sm flex-shrink-0">{t.category_icon}</span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
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
      )}
    </div>
  )
}
