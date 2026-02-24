import React, { useMemo } from 'react'

const PRESETS = [
  { key: 'today', label: 'Hoje', icon: '📌' },
  { key: '7days', label: '7 dias', icon: '📅' },
  { key: '30days', label: '30 dias', icon: '🗓️' },
  { key: 'month', label: 'Mês atual', icon: '📆' },
  { key: 'last-month', label: 'Mês anterior', icon: '⏪' },
]

function getPresetDates(key) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (key) {
    case 'today':
      return { startDate: formatISO(today), endDate: formatISO(today) }
    case '7days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { startDate: formatISO(start), endDate: formatISO(today) }
    }
    case '30days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { startDate: formatISO(start), endDate: formatISO(today) }
    }
    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: formatISO(first), endDate: formatISO(today) }
    }
    case 'last-month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: formatISO(first), endDate: formatISO(last) }
    }
    default:
      return null
  }
}

function formatISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function detectActivePreset(startDate, endDate) {
  if (!startDate || !endDate) return null
  for (const preset of PRESETS) {
    const dates = getPresetDates(preset.key)
    if (dates && dates.startDate === startDate && dates.endDate === endDate) {
      return preset.key
    }
  }
  return null
}

export default function ExtratoQuickPeriod({ startDate, endDate, onSelect }) {
  const activeKey = useMemo(
    () => detectActivePreset(startDate, endDate),
    [startDate, endDate]
  )

  const handleSelect = (key) => {
    const dates = getPresetDates(key)
    if (dates && onSelect) {
      onSelect(dates)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {PRESETS.map((preset) => {
        const isActive = activeKey === preset.key
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => handleSelect(preset.key)}
            className={`
              inline-flex items-center gap-1 sm:gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2
              text-[10px] sm:text-xs font-medium transition-all duration-200
              border focus:outline-none focus:ring-2 focus:ring-offset-1
              ${isActive
                ? 'bg-theme-accent text-white border-transparent shadow-sm focus:ring-theme-accent/40'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-[#0f0f0f] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-gray-600 focus:ring-gray-300 dark:focus:ring-gray-600'
              }
            `}
          >
            <span className="text-xs">{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
