import React, { useState, useMemo } from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import TopSpendingPieChart from '@/Components/system/dashboard/TopSpendingPieChart'
import LoadingOverlay from '@/Components/common/LoadingOverlay'
import useThemeColors from '@/Hooks/useThemeColors'
import { BarChart3, X } from 'lucide-react'

const FILTER_TABS = [
  { key: 'all',    label: 'Todos'   },
  { key: 'debit',  label: 'Débito'  },
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
      case 'debit':  return Array.isArray(debitData)  ? debitData  : []
      case 'credit': return Array.isArray(creditData) ? creditData : []
      default:       return Array.isArray(data)       ? data       : []
    }
  }, [activeFilter, data, debitData, creditData])

  const prepared = useMemo(() => {
    const sorted = [...sourceData].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    const grandTotal = sorted.reduce((acc, item) => acc + Number(item.total || 0), 0)
    return sorted.map((item) => ({
      ...item,
      share: grandTotal > 0 ? Math.round((Number(item.total || 0) / grandTotal) * 100) : 0,
    }))
  }, [sourceData])

  const grandTotal = useMemo(
    () => prepared.reduce((acc, item) => acc + Number(item.total || 0), 0),
    [prepared],
  )

  const colors = chartColors.palette

  const emptyLabel = activeFilter === 'all'
    ? 'Nenhum gasto registrado neste período.'
    : `Sem transações de ${activeFilter === 'debit' ? 'débito' : 'crédito'} neste período.`

  return (
    <div className="relative rounded-2xl themed-card overflow-hidden flex flex-col h-full">
      <LoadingOverlay visible={isLoading} message="Carregando..." />

      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
              <BarChart3 className="w-3.5 h-3.5 text-theme-accent" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                Maiores Gastos
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 truncate">
                {label}
              </p>
            </div>
          </div>

          {hasSelection && onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Limpar seleção"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                activeFilter === tab.key
                  ? 'bg-theme-accent text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        {prepared.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px]">
              {emptyLabel}
            </p>
          </div>
        ) : (
          <TopSpendingPieChart
            labels={prepared.map((item) => item.category_name || 'Sem categoria')}
            values={prepared.map((item) => Number(item.total || 0))}
            total={grandTotal}
            colors={colors}
            items={prepared}
            recurringSpending={activeFilter === 'all' ? recurringSpending : {}}
            nonRecurringSpending={activeFilter === 'all' ? nonRecurringSpending : {}}
          />
        )}
      </div>
    </div>
  )
}
