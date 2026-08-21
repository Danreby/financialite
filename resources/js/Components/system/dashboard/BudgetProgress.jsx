import React from 'react'
import { Settings, Target, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getIconEmoji } from '@/Utils/categoryIcons'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)

const rowColor = (spent, limit) => {
  if (limit === 0) return '#9ca3af'
  const p = (spent / limit) * 100
  if (p >= 100) return '#ef4444'
  if (p >= 80) return '#f59e0b'
  return 'var(--theme-accent)'
}

export default function BudgetProgress({
  budgets = [],
  totalBudget = 0,
  totalSpent = 0,
  onConfigureClick = null,
}) {
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const overBudget = totalSpent > totalBudget && totalBudget > 0
  const warn = pct >= 80 && !overBudget
  const noBudget = totalBudget === 0
  const barColor = overBudget ? '#ef4444' : warn ? '#f59e0b' : 'var(--theme-accent)'

  const statusLabel = overBudget ? 'Excedido' : warn ? 'Atenção' : pct >= 50 ? 'Em uso' : 'Saudável'
  const statusTextColor = overBudget
    ? 'text-red-600 dark:text-red-400'
    : warn
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-green-600 dark:text-green-400'

  return (
    <div
      className="relative overflow-hidden rounded-2xl border flex-1 min-h-0 flex flex-col p-4"
      style={{
        borderColor: !noBudget ? `color-mix(in srgb, ${barColor} 30%, transparent)` : undefined,
        background: !noBudget
          ? `linear-gradient(160deg, color-mix(in srgb, ${barColor} 10%, transparent), transparent 65%)`
          : undefined,
      }}
    >
      {noBudget && <div className="absolute inset-0 -z-10 themed-card rounded-2xl" />}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
            <Target className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Orçamento
            </h3>
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
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
              title="Configurar orçamento"
              aria-label="Configurar orçamento"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {noBudget ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Target className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Sem orçamento definido
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
              Configure limites por categoria para controlar seus gastos
            </p>
          </div>
          {typeof onConfigureClick === 'function' && (
            <button
              onClick={onConfigureClick}
              className="text-[11px] font-medium text-theme-accent hover:underline"
            >
              Configurar agora →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
              style={{ backgroundColor: barColor + '18' }}
            >
              <span
                className="text-xl font-extrabold tabular-nums leading-none"
                style={{ color: barColor }}
              >
                {Math.round(pct)}%
              </span>
              <span className={`text-[9px] font-semibold mt-0.5 ${statusTextColor}`}>
                {statusLabel}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {fmt(totalSpent)}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">gastos</span>
              </div>
              <div className="flex items-baseline gap-1">
                {overBudget ? (
                  <span className="text-sm font-semibold tabular-nums text-red-500">
                    +{fmt(totalSpent - totalBudget)} excedido
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                      {fmt(remaining)}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">restante</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                de {fmt(totalBudget)} no total
              </p>
            </div>
          </div>

          {budgets.length > 0 ? (
            <div className="mb-3">
              <div className="flex h-3 w-full rounded-full overflow-hidden gap-px">
                {budgets.map((b, i) => {
                  const segW = totalBudget > 0 ? (b.limit / totalBudget) * 100 : 0
                  const fillPct =
                    b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
                  const color = rowColor(b.spent, b.limit)
                  return (
                    <div
                      key={i}
                      className="relative h-full flex-shrink-0 bg-gray-100 dark:bg-white/[0.07]"
                      style={{ width: `${segW}%` }}
                      title={`${b.categoryName}: ${fillPct.toFixed(0)}%`}
                    >
                      <div
                        className="absolute inset-0 origin-left transition-transform duration-700"
                        style={{ transform: `scaleX(${fillPct / 100})`, backgroundColor: color }}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Distribuição por categoria
              </p>
            </div>
          ) : (
            <div className="mb-3">
              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full origin-left rounded-full transition-transform duration-700"
                  style={{ transform: `scaleX(${pct / 100})`, backgroundColor: barColor }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400 tabular-nums">{pct.toFixed(0)}% utilizado</span>
                {!overBudget && (
                  <span className="text-[10px] text-gray-400 tabular-nums">
                    {(100 - pct).toFixed(0)}% livre
                  </span>
                )}
              </div>
            </div>
          )}

          {budgets.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Por categoria
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-2.5">
                {budgets.map((budget, i) => {
                  const catPctRaw =
                    budget.limit > 0
                      ? (budget.spent / budget.limit) * 100
                      : 0
                  const catPct = Math.min(catPctRaw, 100)
                  const accent = rowColor(budget.spent, budget.limit)
                  const icon = budget.categoryIcon ? getIconEmoji(budget.categoryIcon) : null
                  const isOver = budget.spent > budget.limit && budget.limit > 0
                  const isDone = catPctRaw >= 100

                  return (
                    <div key={i} className="group">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px]"
                          style={{ backgroundColor: accent + '20', color: accent }}
                        >
                          {icon || (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: accent }}
                            />
                          )}
                        </div>
                        <span className="flex-1 min-w-0 text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                          {budget.categoryName || 'Sem categoria'}
                        </span>
                        <span
                          className={`text-[10px] tabular-nums flex-shrink-0 ${
                            isOver
                              ? 'font-semibold text-red-500'
                              : isDone
                                ? 'font-medium text-green-600 dark:text-green-400'
                                : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {fmt(budget.spent)}
                          <span className="mx-0.5 opacity-40">/</span>
                          {fmt(budget.limit)}
                        </span>
                        {isDone && !isOver && (
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 pl-[26px]">
                        <div className="relative h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                          <div
                            className="absolute inset-0 origin-left rounded-full transition-transform duration-500"
                            style={{ transform: `scaleX(${catPct / 100})`, backgroundColor: accent }}
                          />
                        </div>
                        {isOver ? (
                          <span className="text-[10px] tabular-nums text-right flex-shrink-0 font-semibold text-red-500 whitespace-nowrap">
                            +{fmt(budget.spent - budget.limit)}
                          </span>
                        ) : (
                          <span
                            className="text-[10px] tabular-nums w-7 text-right flex-shrink-0 font-medium"
                            style={{ color: accent }}
                          >
                            {catPct.toFixed(0)}%
                          </span>
                        )}
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
