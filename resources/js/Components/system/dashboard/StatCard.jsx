import FinancialIcon from '@/Components/common/icons/FinancialIcon'
import React from 'react'

export default function StatCard({ title, value, delta, icon, deltaVariant }) {
  const deltaColor =
    deltaVariant === 'warning'
      ? 'text-amber-400'
      : deltaVariant === 'danger'
      ? 'text-red-400'
      : deltaVariant === 'neutral'
      ? 'text-gray-400 dark:text-gray-500'
      : delta && typeof delta === 'string' && delta.startsWith('-')
      ? 'text-red-400'
      : 'text-emerald-400'

  return (
    <div className="rounded-2xl themed-card p-3 lg:p-3.5 flex items-center gap-3">
      {icon && (
        <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400">
          <FinancialIcon type={icon}/>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{title}</div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <div className="text-base lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</div>
          {delta && (
            <div className={`text-[11px] lg:text-xs font-medium shrink-0 ${deltaColor}`}>{delta}</div>
          )}
        </div>
      </div>
    </div>
  )
}
