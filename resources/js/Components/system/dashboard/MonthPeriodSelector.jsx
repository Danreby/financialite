import React, { useState, useCallback, useMemo } from 'react'

/**
 * Reusable month period selector for selecting "from" and "to" month range.
 * Used in the dashboard to filter top spending by a custom period.
 *
 * @param {Array} months - Array of { month_key: 'YYYY-MM', month_label: 'Mon YYYY' }
 * @param {Function} onPeriodChange - Callback with { monthFrom, monthTo } or null when cleared
 * @param {boolean} disabled - Whether the selector is disabled
 */
export default function MonthPeriodSelector({ months = [], onPeriodChange, disabled = false }) {
  const [monthFrom, setMonthFrom] = useState('')
  const [monthTo, setMonthTo] = useState('')

  const monthOptions = useMemo(() => {
    return months.map((m) => ({
      key: m.month_key,
      label: m.month_label,
    }))
  }, [months])

  const filteredToOptions = useMemo(() => {
    if (!monthFrom) return monthOptions
    return monthOptions.filter((m) => m.key >= monthFrom)
  }, [monthFrom, monthOptions])

  const handleFromChange = useCallback((e) => {
    const value = e.target.value
    setMonthFrom(value)

    if (!value) {
      setMonthTo('')
      onPeriodChange?.(null)
      return
    }

    if (monthTo && monthTo < value) {
      setMonthTo(value)
      onPeriodChange?.({ monthFrom: value, monthTo: value })
    } else if (monthTo) {
      onPeriodChange?.({ monthFrom: value, monthTo })
    } else {
      setMonthTo(value)
      onPeriodChange?.({ monthFrom: value, monthTo: value })
    }
  }, [monthTo, onPeriodChange])

  const handleToChange = useCallback((e) => {
    const value = e.target.value
    setMonthTo(value)

    if (!value || !monthFrom) {
      onPeriodChange?.(null)
      return
    }

    onPeriodChange?.({ monthFrom, monthTo: value })
  }, [monthFrom, onPeriodChange])

  const handleClear = useCallback(() => {
    setMonthFrom('')
    setMonthTo('')
    onPeriodChange?.(null)
  }, [onPeriodChange])

  const hasSelection = Boolean(monthFrom && monthTo)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-400 whitespace-nowrap">
        Período
      </span>

      <select
        value={monthFrom}
        onChange={handleFromChange}
        disabled={disabled || monthOptions.length === 0}
        className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 min-w-0"
        aria-label="Mês inicial do período"
      >
        <option value="">De</option>
        {monthOptions.map((m) => (
          <option key={m.key} value={m.key}>{m.label}</option>
        ))}
      </select>

      <span className="text-[11px] text-gray-400 select-none">—</span>

      <select
        value={monthTo}
        onChange={handleToChange}
        disabled={disabled || !monthFrom}
        className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 min-w-0"
        aria-label="Mês final do período"
      >
        <option value="">Até</option>
        {filteredToOptions.map((m) => (
          <option key={m.key} value={m.key}>{m.label}</option>
        ))}
      </select>

      {hasSelection && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="text-[11px] px-1.5 py-0.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Limpar período selecionado"
        >
          ✕
        </button>
      )}
    </div>
  )
}
