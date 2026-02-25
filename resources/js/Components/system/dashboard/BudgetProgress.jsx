import React from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Settings } from 'lucide-react'

export default function BudgetProgress({ budgets = [], totalBudget = 0, totalSpent = 0, onConfigureClick = null }) {
  const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const isOverBudget = totalSpent > totalBudget

  const getStatusColor = (spent, limit) => {
    if (limit === 0) return 'text-gray-500'
    const pct = (spent / limit) * 100
    if (pct >= 100) return 'text-red-500'
    if (pct >= 80) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressColor = (spent, limit) => {
    if (limit === 0) return 'bg-gray-400'
    const pct = (spent / limit) * 100
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 80) return 'bg-yellow-500'
    return 'bg-[var(--theme-accent)]'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="themed-card rounded-xl p-4 sm:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          Orçamento Mensal
        </h3>
        <div className="flex items-center gap-2">
          {isOverBudget && (
            <div className="flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Excedido</span>
            </div>
          )}
          {typeof onConfigureClick === 'function' && (
            <button
              onClick={onConfigureClick}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              title="Configurar orçamento"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-2">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Orçamento Total
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isOverBudget ? 'bg-red-500' : 'bg-[var(--theme-accent)]'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {percentage.toFixed(1)}% utilizado
          </div>
          <div className={`text-xs font-medium ${
            isOverBudget ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {isOverBudget ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatCurrency(Math.abs(remaining))} acima
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {formatCurrency(remaining)} restante
              </span>
            )}
          </div>
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto scrollbar-custom">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Por Categoria
          </div>
          {budgets.map((budget, index) => {
            const categoryPct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-full sm:max-w-[150px]">
                    {budget.categoryName || 'Sem categoria'}
                  </span>
                  <span className={`text-xs font-medium ${getStatusColor(budget.spent, budget.limit)}`}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor(budget.spent, budget.limit)}`}
                    style={{ width: `${Math.min(categoryPct, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {categoryPct.toFixed(0)}%
                </div>
              </div>
            )
          })}
        </div>
      )}

      {budgets.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Nenhum orçamento definido
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Configure orçamentos por categoria para acompanhar seus gastos
          </p>
        </div>
      )}
    </div>
  )
}
