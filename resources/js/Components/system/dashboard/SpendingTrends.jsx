import React from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from 'lucide-react'
import { getIconEmoji } from '@/Utils/categoryIcons'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

const calcChange = (current, ref) => {
  if (ref === 0) return { val: 0, dir: 'neutral' }
  const v = ((current - ref) / ref) * 100
  return { val: Math.abs(v), dir: v > 5 ? 'up' : v < -5 ? 'down' : 'neutral' }
}

const dirColor = (dir) =>
  ({ up: 'text-red-500', down: 'text-green-600 dark:text-green-400', neutral: 'text-gray-500' })[dir] ?? 'text-gray-500'

const dirBg = (dir) =>
  ({ up: 'bg-red-50 dark:bg-red-900/20', down: 'bg-green-50 dark:bg-green-900/20', neutral: 'bg-gray-100 dark:bg-gray-800' })[dir] ?? 'bg-gray-100'

const DirIcon = (dir) => ({ up: ArrowUpRight, down: ArrowDownRight, neutral: Minus })[dir] ?? Minus

export default function SpendingTrends({
  currentMonth = 0,
  previousMonth = 0,
  threeMonthAvg = 0,
  categoryTrends = [],
  hasData = true,
}) {
  const vsMonth = calcChange(currentMonth, previousMonth)
  const vsAvg   = calcChange(currentMonth, threeMonthAvg)

  const compMax    = Math.max(currentMonth, previousMonth, 1)
  const currentPct = Math.round((currentMonth  / compMax) * 100)
  const prevPct    = Math.round((previousMonth / compMax) * 100)

  const MonthIcon = DirIcon(vsMonth.dir)

  return (
    <div className="themed-card rounded-2xl p-4 flex-1 min-h-0 flex flex-col">

      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
          <TrendingUp className="w-3.5 h-3.5 text-theme-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">Tendências</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">Análise de gastos</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Dados insuficientes</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-[180px]">
            Registre transações de débito para visualizar tendências
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                Mês Atual
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
                {fmt(currentMonth)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-0.5 flex-shrink-0 ${dirBg(vsMonth.dir)} ${dirColor(vsMonth.dir)}`}>
              <MonthIcon className="w-3 h-3" />
              {vsMonth.val.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-14 flex-shrink-0 text-right">Atual</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentPct}%`, backgroundColor: 'var(--theme-accent)' }}
                />
              </div>
              <span className="text-[9px] text-gray-400 w-7 text-right flex-shrink-0 tabular-nums">{currentPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-14 flex-shrink-0 text-right">Anterior</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-400 dark:bg-gray-500 transition-all duration-500"
                  style={{ width: `${prevPct}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 w-7 text-right flex-shrink-0 tabular-nums">{prevPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'vs Mês anterior', change: vsMonth, ref: previousMonth },
              { label: 'vs Média 3m',     change: vsAvg,   ref: threeMonthAvg },
            ].map(({ label, change, ref }) => {
              const Icon = DirIcon(change.dir)
              return (
                <div key={label} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mb-1">{label}</p>
                  <div className={`inline-flex items-center gap-0.5 text-xs font-semibold ${dirColor(change.dir)}`}>
                    <Icon className="w-3 h-3" />
                    {change.val.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">{fmt(ref)}</p>
                </div>
              )
            })}
          </div>

          {categoryTrends.length > 0 ? (
            <>
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Por categoria
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom space-y-0.5">
                {categoryTrends.map((trend, i) => {
                  const t    = calcChange(trend.current, trend.previous)
                  const Icon = DirIcon(t.dir)
                  const icon = trend.categoryIcon ? getIconEmoji(trend.categoryIcon) : null
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      {icon && <span className="text-xs leading-none flex-shrink-0">{icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                          {trend.categoryName || 'Sem categoria'}
                        </p>
                        <p className="text-[10px] text-gray-400 tabular-nums">{fmt(trend.current)}</p>
                      </div>
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0 ${dirBg(t.dir)} ${dirColor(t.dir)}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {t.val.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${vsMonth.dir === 'up' ? 'bg-red-50 dark:bg-red-900/15' : vsMonth.dir === 'down' ? 'bg-green-50 dark:bg-green-900/15' : 'bg-gray-50 dark:bg-white/[0.04]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vsMonth.dir === 'up' ? 'bg-red-500' : vsMonth.dir === 'down' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <p className={`text-[11px] font-medium ${vsMonth.dir === 'up' ? 'text-red-700 dark:text-red-300' : vsMonth.dir === 'down' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                {vsMonth.dir === 'up'      && `Você gastou ${vsMonth.val.toFixed(1)}% a mais este mês`}
                {vsMonth.dir === 'down'    && `Você economizou ${vsMonth.val.toFixed(1)}% este mês`}
                {vsMonth.dir === 'neutral' && 'Gastos estáveis comparado ao mês anterior'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
