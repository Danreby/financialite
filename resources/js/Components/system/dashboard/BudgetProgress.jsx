import React from 'react'
import { Settings, Target, AlertCircle } from 'lucide-react'
import { getIconEmoji } from '@/Utils/categoryIcons'

const ARC_R   = 44
const ARC_LEN = Math.PI * ARC_R

function SemiGauge({ pct, strokeColor }) {
  const fillLen = (Math.min(pct, 100) / 100) * ARC_LEN
  return (
    <svg viewBox="0 0 100 66" fill="none" className="w-full">
      <path
        d="M 6 52 A 44 44 0 0 0 94 52"
        stroke="currentColor"
        className="text-gray-200 dark:text-white/[0.08]"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 6 52 A 44 44 0 0 0 94 52"
        stroke={strokeColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={String(ARC_LEN)}
        strokeDashoffset={String(ARC_LEN - fillLen)}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const rowColor = (spent, limit) => {
  if (limit === 0) return '#9ca3af'
  const p = (spent / limit) * 100
  if (p >= 100) return '#ef4444'
  if (p >= 80) return '#f59e0b'
  return 'var(--theme-accent)'
}

export default function BudgetProgress({ budgets = [], totalBudget = 0, totalSpent = 0, onConfigureClick = null }) {
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const overBudget = totalSpent > totalBudget && totalBudget > 0
  const warn = pct >= 80 && !overBudget
  const noBudget = totalBudget === 0
  const gaugeColor = overBudget ? '#ef4444' : warn ? '#f59e0b' : 'var(--theme-accent)'

  return (
    <div className="themed-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-2">
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
          <div className="relative px-2">
            <SemiGauge pct={pct} strokeColor={gaugeColor} />
            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pb-2">
              <span
                className="text-2xl font-bold tabular-nums leading-none"
                style={{ color: overBudget ? '#ef4444' : warn ? '#f59e0b' : undefined }}
              >
                {Math.round(Math.min(pct, 999))}%
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">utilizado</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-3 mb-4">
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-2 py-2 text-center">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mb-0.5">Gasto</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{fmt(totalSpent)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-2 py-2 text-center">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mb-0.5">Limite</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{fmt(totalBudget)}</p>
            </div>
            <div className={`rounded-xl px-2 py-2 text-center ${overBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <p className={`text-[9px] leading-tight mb-0.5 ${overBudget ? 'text-red-400' : 'text-green-500'}`}>
                {overBudget ? 'Excesso' : 'Restante'}
              </p>
              <p className={`text-[11px] font-bold tabular-nums leading-tight ${overBudget ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                {fmt(overBudget ? totalSpent - totalBudget : remaining)}
              </p>
            </div>
          </div>

          {budgets.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Por categoria
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-2.5">
                {budgets.map((budget, i) => {
                  const categoryPct = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                  const accent = rowColor(budget.spent, budget.limit)
                  const icon = budget.categoryIcon ? getIconEmoji(budget.categoryIcon) : null
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {icon && <span className="text-[11px] leading-none flex-shrink-0">{icon}</span>}
                        <span className="flex-1 min-w-0 text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                          {budget.categoryName || 'Sem categoria'}
                        </span>
                        <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {fmt(budget.spent)}<span className="mx-0.5 text-gray-300 dark:text-gray-600">/</span>{fmt(budget.limit)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
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
