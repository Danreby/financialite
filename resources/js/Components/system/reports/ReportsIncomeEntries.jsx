import React, { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import ScrollArea from '@/Components/common/ScrollArea'

const TYPE_CONFIG = {
  pix:        { icon: '⚡', label: 'Pix' },
  freelance:  { icon: '💻', label: 'Freelance' },
  investment: { icon: '📈', label: 'Investimento' },
  rental:     { icon: '🏠', label: 'Aluguel' },
  benefit:    { icon: '🎁', label: 'Benefício' },
  other:      { icon: '💰', label: 'Outro' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function ReportsIncomeEntries({ entries = [], selectedYear = '' }) {
  const [selectedMonth, setSelectedMonth] = useState('')

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (selectedYear && e.month_key && !e.month_key.startsWith(selectedYear)) return false
      if (selectedMonth && e.month_key !== selectedMonth) return false
      return true
    })
  }, [entries, selectedYear, selectedMonth])

  // Build unique months for the filter select
  const availableMonths = useMemo(() => {
    const months = new Map()
    for (const e of entries) {
      if (!e.month_key) continue
      if (selectedYear && !e.month_key.startsWith(selectedYear)) continue
      if (!months.has(e.month_key)) {
        const [y, m] = e.month_key.split('-')
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
        months.set(e.month_key, label.charAt(0).toUpperCase() + label.slice(1))
      }
    }
    return Array.from(months.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }))
  }, [entries, selectedYear])

  const total = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered])

  if (entries.length === 0) return null

  return (
    <div className="rounded-2xl themed-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
            Entradas Avulsas
          </h2>
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {availableMonths.length > 1 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f0f0f] px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 shadow-sm themed-focus"
            >
              <option value="">Todos os meses</option>
              {availableMonths.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          )}
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            {formatCurrencyBRL(total)}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
          Nenhuma entrada avulsa para o período selecionado.
        </p>
      ) : (
        <ScrollArea maxHeightClassName="max-h-[320px]" className="space-y-2 pr-1">
          {filtered.map((entry) => {
            const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.other
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-lg">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {entry.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{config.label}</span>
                    {entry.received_at && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(entry.received_at)}
                        </span>
                      </>
                    )}
                    {entry.description && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                          {entry.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  {formatCurrencyBRL(entry.amount)}
                </span>
              </div>
            )
          })}
        </ScrollArea>
      )}
    </div>
  )
}
