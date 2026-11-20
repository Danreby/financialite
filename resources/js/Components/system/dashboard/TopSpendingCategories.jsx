import { useId, useMemo, useState } from 'react'
import { ChartColumn } from 'lucide-react'
import { Card, EmptyState, MoneyText, SegmentedControl, Select, Skeleton } from '@/Components/ui'
import useThemeColors from '@/Hooks/useThemeColors'
import { formatPercent, withShares } from '@/Lib/dashboard'

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
]

const KEYS = { all: 'top_spending_categories', debit: 'debit_spending_categories', credit: 'credit_spending_categories' }

/**
 * "Maiores gastos" por categoria, do mês vigente ou do mês escolhido (no
 * seletor ou com clique no gráfico). Barra com a fatia de cada categoria,
 * valor e percentual escritos; recorrente × variável no filtro "Todos".
 */
export default function TopSpendingCategories({ stats, monthData, months = [], selectedMonth, onSelectMonth, loading, monthLoading, className = '' }) {
  const [filter, setFilter] = useState('all')
  const { chartColors } = useThemeColors()
  const selectId = useId()
  const source = monthData ?? stats ?? {}

  const items = useMemo(() => withShares(source[KEYS[filter]]), [source, filter])
  const total = items.reduce((sum, item) => sum + item.total, 0)
  const recurring = Number(source.recurring_spending?.percentage) || 0
  const variable = Number(source.non_recurring_spending?.percentage) || 0
  const label = monthData?.period_label ?? stats?.top_spending_label ?? 'Mês vigente'
  const busy = loading || monthLoading

  return (
    <Card title="Maiores gastos" subtitle={`Por categoria em ${label}`} className={className} aria-busy={busy || undefined}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={selectId} className="text-xs font-medium text-content-muted">
            Mês
          </label>
          <Select id={selectId} size="sm" value={selectedMonth ?? ''} onChange={(e) => onSelectMonth?.(e.target.value || null)} disabled={loading}>
            <option value="">Mês vigente</option>
            {months.map((m) => (
              <option key={m.month_key} value={m.month_key}>
                {m.month_label}
              </option>
            ))}
          </Select>
        </div>
        <SegmentedControl size="sm" fullWidth label="Tipo de gasto" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {busy ? (
        <div className="mt-4 flex flex-col gap-3">
          <span className="sr-only">Carregando gastos</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} lines={2} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={ChartColumn} title="Sem gastos neste período" text={filter === 'all' ? 'Nenhum gasto registrado no mês.' : `Nenhuma compra no ${filter === 'debit' ? 'débito' : 'crédito'} no mês.`} className="py-6" />
      ) : (
        <>
          <p className="mt-4 flex items-baseline justify-between gap-3 text-xs text-content-muted">
            Total
            <MoneyText value={total} className="text-base font-semibold" />
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {items.map((item, index) => {
              const color = item.category_color || chartColors.palette[index % chartColors.palette.length]
              return (
                <li key={item.category_id ?? `sem-${index}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-content-secondary">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="truncate">{item.category_name || 'Sem categoria'}</span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <MoneyText value={item.total} className="font-semibold" />
                      <span className="w-9 text-right text-xs text-content-muted tabular-nums">{formatPercent(item.share)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${item.bar}%`, backgroundColor: color }} />
                  </div>
                </li>
              )
            })}
          </ol>
          {filter === 'all' && (recurring > 0 || variable > 0) && (
            <p className="mt-4 border-t border-line pt-3 text-xs text-content-muted">
              Recorrentes <span className="font-semibold text-content-secondary tabular-nums">{formatPercent(recurring)}</span>
              <span aria-hidden="true"> · </span>
              Variáveis <span className="font-semibold text-content-secondary tabular-nums">{formatPercent(variable)}</span>
            </p>
          )}
        </>
      )}
    </Card>
  )
}
