import React, { useMemo } from 'react'

export default function ExtratoPeriodBadge({ startDate, endDate }) {
  const periodInfo = useMemo(() => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null
    }

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const formatDate = (date) =>
      date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    let periodType = 'custom'
    let label = `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startMonth = start.getMonth()
    const startYear = start.getFullYear()

    if (
      startMonth === currentMonth &&
      startYear === currentYear &&
      start.getDate() === 1 &&
      end.getMonth() === currentMonth
    ) {
      periodType = 'current-month'
      label = 'Mês atual'
    }

    const lastMonth = new Date(currentYear, currentMonth - 1, 1)
    if (
      startMonth === lastMonth.getMonth() &&
      startYear === lastMonth.getFullYear() &&
      start.getDate() === 1
    ) {
      periodType = 'last-month'
      label = 'Mês anterior'
    }

    if (diffDays === 1 && start.toDateString() === now.toDateString()) {
      periodType = 'today'
      label = 'Hoje'
    }

    if (diffDays === 7) {
      periodType = '7-days'
      label = 'Últimos 7 dias'
    }

    if (diffDays === 30 || diffDays === 31) {
      periodType = '30-days'
      label = 'Últimos 30 dias'
    }

    return {
      type: periodType,
      label,
      days: diffDays,
      startFormatted: formatDate(start),
      endFormatted: formatDate(end),
    }
  }, [startDate, endDate])

  if (!periodInfo) return null

  const bgColor = {
    'current-month': 'bg-blue-50 dark:bg-blue-900/20',
    'last-month': 'bg-purple-50 dark:bg-purple-900/20',
    today: 'bg-emerald-50 dark:bg-emerald-900/20',
    '7-days': 'bg-amber-50 dark:bg-amber-900/20',
    '30-days': 'bg-indigo-50 dark:bg-indigo-900/20',
    custom: 'bg-gray-50 dark:bg-gray-900/20',
  }[periodInfo.type]

  const textColor = {
    'current-month': 'text-blue-700 dark:text-blue-300',
    'last-month': 'text-purple-700 dark:text-purple-300',
    today: 'text-emerald-700 dark:text-emerald-300',
    '7-days': 'text-amber-700 dark:text-amber-300',
    '30-days': 'text-indigo-700 dark:text-indigo-300',
    custom: 'text-gray-700 dark:text-gray-300',
  }[periodInfo.type]

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg ${bgColor} px-3 py-1.5`}>
      <span className="text-xs">📅</span>
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${textColor}`}>
          {periodInfo.label}
        </span>
        <span className="text-[9px] text-gray-500 dark:text-gray-400">
          {periodInfo.startFormatted} - {periodInfo.endFormatted}
        </span>
      </div>
    </div>
  )
}
