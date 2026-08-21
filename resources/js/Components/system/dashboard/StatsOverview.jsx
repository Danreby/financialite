import React from 'react'

const DELTA_COLOR = {
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-400 dark:text-gray-500',
}

function deltaColorFor(stat) {
  if (DELTA_COLOR[stat.deltaVariant]) return DELTA_COLOR[stat.deltaVariant]
  if (typeof stat.delta === 'string' && stat.delta.startsWith('-')) return DELTA_COLOR.danger
  return 'text-emerald-600 dark:text-emerald-400'
}

export default function StatsOverview({ stats = [] }) {
  return (
    <div
      className="themed-strip rounded-2xl overflow-hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-white/[0.06]"
      role="group"
      aria-label="Resumo financeiro do mês"
    >
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <div key={stat.id} className="min-w-0 p-3.5 lg:p-4">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-theme-accent" aria-hidden="true" />}
              <span className="truncate text-[11px] font-medium">{stat.title}</span>
            </div>
            <div className="mt-1.5 truncate text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100 lg:text-xl">
              {stat.value}
            </div>
            {stat.delta && (
              <div className={`mt-0.5 truncate text-[11px] font-medium ${deltaColorFor(stat)}`}>
                {stat.delta}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
