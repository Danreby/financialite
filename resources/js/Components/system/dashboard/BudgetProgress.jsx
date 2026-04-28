import React from 'react'
import { Settings, Target, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getIconEmoji } from '@/Utils/categoryIcons'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const rowColor = (spent, limit) => {
  if (limit === 0) return '#9ca3af'
  const p = (spent / limit) * 100
  if (p >= 100) return '#ef4444'
  if (p >= 80)  return '#f59e0b'
  return 'var(--theme-accent)'
}

export default function BudgetProgress({ budgets = [], totalBudget = 0, totalSpent = 0, onConfigureClick = null }) {
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const overBudget = totalSpent > totalBudget && totalBudget > 0
  const warn = pct >= 80 && !overBudget
  const noBudget = totalBudget === 0
  const barColor = overBudget ? '#ef4444' : warn ? '#f59e0b' : 'var(--theme-accent)'

  return (
    <div className="themed-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
            <Target className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">Orçamento</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">Mensal</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {overBudget && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/25 text-red-500 dark:text-red-400 text-[11px] font-medium">
              <AlertCircle className="w-3 h-3" />
              Excedido
            </span>
          )}
          {typeof onConfigureClick === 'function' && (
            <button
              onClick={onConfigureClick}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Configurar orçamento"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {noBudget ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Target className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Sem orçamento definido</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
              Configure limites por categoria para controlar seus gastos
            </p>
          </div>
          {typeof onConfigureClick === 'function' && (
            <button onClick={onConfigureClick} className="text-[11px] font-medium text-theme-accent hover:underline">
              Configurar agora →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Gasto até agora</p>
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
                  {fmt(totalSpent)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  de {fmt(totalBudget)}
                </p>
              </div>
              <div className="text-right">
                {overBudget ? (
                  <div>
                    <p className="text-[10px] text-red-400 mb-0.5">Excesso</p>
                    <p className="text-base font-bold tabular-nums text-red-500 leading-none">
                      +{fmt(totalSpent - totalBudget)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Restante</p>
                    <p className="text-base font-bold tabular-nums text-green-600 dark:text-green-400 leading-none">
                      {fmt(remaining)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                {pct.toFixed(0)}% utilizado
              </span>
              {!overBudget && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                  {(100 - pct).toFixed(0)}% livre
                </span>
              )}
            </div>
          </div>

          {budgets.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Por categoria
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-3">
                {budgets.map((budget, i) => {
                  const categoryPct = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                  const accent      = rowColor(budget.spent, budget.limit)
                  const icon        = budget.categoryIcon ? getIconEmoji(budget.categoryIcon) : null
                  const isOver      = budget.spent > budget.limit && budget.limit > 0
                  const isDone      = categoryPct >= 100

                  return (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {icon
                          ? <span className="text-[12px] leading-none flex-shrink-0">{icon}</span>
                          : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                        }
                        <span className="flex-1 min-w-0 text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                          {budget.categoryName || 'Sem categoria'}
                        </span>
                        {isDone ? (
                          isOver
                            ? <span className="text-[10px] font-semibold text-red-500 flex-shrink-0">Excedido</span>
                            : <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <span className="text-[10px] tabular-nums text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {fmt(budget.spent)}<span className="mx-0.5 opacity-40">/</span>{fmt(budget.limit)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pl-[14px]">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${categoryPct}%`, backgroundColor: accent }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 w-7 text-right flex-shrink-0 tabular-nums">
                          {categoryPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
