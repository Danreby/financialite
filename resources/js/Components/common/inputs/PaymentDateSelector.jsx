import React, { useState, useCallback, useMemo } from 'react'

const getToday = () => new Date().toISOString().slice(0, 10)

const getYesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: 'today', label: 'Hoje', getDate: getToday },
  { key: 'yesterday', label: 'Ontem', getDate: getYesterday },
  { key: 'custom', label: 'Outro dia', getDate: () => '' },
]

export default function PaymentDateSelector({
  value,
  onChange,
  name = 'paid_date',
  className = '',
  compact = false,
}) {
  const today = useMemo(getToday, [])
  const yesterday = useMemo(getYesterday, [])

  const activePreset = useMemo(() => {
    if (value === today) return 'today'
    if (value === yesterday) return 'yesterday'
    if (value && value !== today && value !== yesterday) return 'custom'
    return null
  }, [value, today, yesterday])

  const [showCustom, setShowCustom] = useState(activePreset === 'custom')

  const handlePreset = useCallback(
    (preset) => {
      if (preset.key === 'custom') {
        setShowCustom(true)
        if (!value || value === today || value === yesterday) {
          onChange?.('')
        }
      } else {
        setShowCustom(false)
        onChange?.(preset.getDate())
      }
    },
    [onChange, value, today, yesterday]
  )

  const handleCustomChange = useCallback(
    (e) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  const btnBase = compact
    ? 'px-2.5 py-1 text-[11px] sm:text-xs'
    : 'px-3 py-1.5 text-xs sm:text-sm'

  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`block font-medium text-gray-700 dark:text-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}>
        Quando pagou?
      </label>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const isActive =
            preset.key === 'custom'
              ? showCustom && activePreset === 'custom'
              : activePreset === preset.key

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`
                ${btnBase}
                rounded-lg font-medium transition-all duration-150
                focus:outline-none focus:ring-2 themed-ring focus:ring-offset-1
                ${
                  isActive || (preset.key === 'custom' && showCustom)
                    ? 'themed-selected shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              `}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      {showCustom && (
        <input
          type="date"
          name={name}
          value={value || ''}
          onChange={handleCustomChange}
          max={today}
          className={`
            w-full rounded-lg border border-gray-300 bg-white shadow-sm
            dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100
            focus:border-transparent focus:outline-none focus:ring-2 themed-ring
            ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
          `}
          autoComplete="off"
        />
      )}

      {!showCustom && value && (
        <input type="hidden" name={name} value={value} />
      )}
    </div>
  )
}
