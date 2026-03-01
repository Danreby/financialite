import React, { useState, useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import TopSpendingPieChart from '@/Components/system/dashboard/TopSpendingPieChart'
import LoadingOverlay from '@/Components/common/LoadingOverlay'
import useThemeColors from '@/Hooks/useThemeColors'

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'debit', label: 'Débito' },
  { key: 'credit', label: 'Crédito' },
]

export default function TopSpendingCategories({
  data = [],
  debitData = [],
  creditData = [],
  label = 'Mês vigente',
  recurringSpending = {},
  nonRecurringSpending = {},
  isLoading = false,
  hasSelection = false,
  onClearSelection,
}) {
  const { chartColors } = useThemeColors()
  const [activeFilter, setActiveFilter] = useState('all')

  const sourceData = useMemo(() => {
    switch (activeFilter) {
      case 'debit':
        return Array.isArray(debitData) ? debitData : []
      case 'credit':
        return Array.isArray(creditData) ? creditData : []
      default:
        return Array.isArray(data) ? data : []
    }
  }, [activeFilter, data, debitData, creditData])

  const topSix = useMemo(() => {
    return [...sourceData].sort((a, b) => Number(b.total || 0) - Number(a.total || 0)).slice(0, 6)
  }, [sourceData])

  const totalTop = topSix.reduce((acc, item) => acc + Number(item.total || 0), 0)

  const prepared = topSix.map((item) => {
    const share = totalTop > 0 ? Math.round((Number(item.total || 0) / totalTop) * 100) : 0
    return {
      ...item,
      share,
    }
  })

  const colors = chartColors.palette

  return (
    <div className="relative rounded-2xl themed-card p-4 overflow-hidden">
      <LoadingOverlay visible={isLoading} message="Carregando..." />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
          Maiores Gastos — {label}
        </h2>
        {hasSelection && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs px-2 py-1 rounded-md text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            aria-label="Limpar seleção"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeFilter === tab.key
                ? 'bg-[var(--theme-accent)] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(!prepared || prepared.length === 0) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {activeFilter === 'all'
            ? 'Ainda não há gastos para este mês.'
            : `Sem transações de ${activeFilter === 'debit' ? 'débito' : 'crédito'} neste período.`}
        </p>
      )}

      {prepared && prepared.length > 0 && (
        <TopSpendingPieChart
          labels={prepared.map((item) => item.category_name || 'Sem categoria')}
          values={prepared.map((item) => Number(item.total || 0))}
          total={totalTop}
          colors={colors}
          items={prepared}
          recurringSpending={activeFilter === 'all' ? recurringSpending : {}}
          nonRecurringSpending={activeFilter === 'all' ? nonRecurringSpending : {}}
        />
      )}
    </div>
  )
}
