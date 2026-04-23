import React from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react'

export default function SpendingTrends({ 
  currentMonth = 0, 
  previousMonth = 0, 
  threeMonthAvg = 0,
  categoryTrends = [],
  hasData = true
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const calculateChange = (current, previous) => {
    if (previous === 0) return { percentage: 0, direction: 'neutral' }
    const change = ((current - previous) / previous) * 100
    const direction = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral'
    return { percentage: change, direction }
  }

  const monthChange = calculateChange(currentMonth, previousMonth)
  const avgChange = calculateChange(currentMonth, threeMonthAvg)

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      default:
        return Minus
    }
  }

  const getTrendColor = (direction, isExpense = true) => {
    if (direction === 'neutral') return 'text-gray-500'
    if (isExpense) {
      return direction === 'up' ? 'text-red-500' : 'text-green-500'
    }
    return direction === 'up' ? 'text-green-500' : 'text-red-500'
  }

  const getTrendBgColor = (direction, isExpense = true) => {
    if (direction === 'neutral') return 'bg-gray-100 dark:bg-gray-800'
    if (isExpense) {
      return direction === 'up' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
    }
    return direction === 'up' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="themed-card rounded-xl p-6 flex-1 min-h-0 flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--theme-accent)]" />
          Tendências de Gastos
        </h3>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dados insuficientes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[220px]">
              Registre transações de débito para visualizar suas tendências de gastos
            </p>
          </div>
        </div>
      ) : (
      <>
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mês Atual vs Anterior
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendBgColor(monthChange.direction)} ${getTrendColor(monthChange.direction)}`}>
              {monthChange.direction === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : monthChange.direction === 'down' ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {Math.abs(monthChange.percentage).toFixed(1)}%
            </div>
          </div>
          
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentMonth)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              de {formatCurrency(previousMonth)}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mês Atual vs Média (3 meses)
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendBgColor(avgChange.direction)} ${getTrendColor(avgChange.direction)}`}>
              {avgChange.direction === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : avgChange.direction === 'down' ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {Math.abs(avgChange.percentage).toFixed(1)}%
            </div>
          </div>
          
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentMonth)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              de {formatCurrency(threeMonthAvg)}
            </div>
          </div>
        </div>
      </div>

      {categoryTrends.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Por Categoria
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-3">
              {categoryTrends.map((trend, index) => {
                const trendInfo = calculateChange(trend.current, trend.previous)
                const TrendIcon = getTrendIcon(trendInfo.direction)

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {trend.categoryName || 'Sem categoria'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatCurrency(trend.current)}
                      </div>
                    </div>
                    
                    <div className={`ml-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendBgColor(trendInfo.direction)} ${getTrendColor(trendInfo.direction)}`}>
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(trendInfo.percentage).toFixed(0)}%
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {monthChange.direction === 'up' && (
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Você gastou <strong>{Math.abs(monthChange.percentage).toFixed(1)}%</strong> a mais este mês
            </p>
          )}
          {monthChange.direction === 'down' && (
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Você economizou <strong>{Math.abs(monthChange.percentage).toFixed(1)}%</strong> este mês
            </p>
          )}
          {monthChange.direction === 'neutral' && (
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              Seus gastos estão estáveis comparado ao mês anterior
            </p>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
