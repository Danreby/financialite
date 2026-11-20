import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, ChartLine, Minus } from 'lucide-react'
import { Card, EmptyState, MoneyText, Skeleton } from '@/Components/ui'
import { buildTrends, changeLabel } from '@/Lib/dashboard'

const ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus }
// Gasto subindo é ruim, caindo é bom.
const TONE = { up: 'text-danger-strong', down: 'text-success-strong', flat: 'text-content-muted' }
const WORD = { up: 'mais', down: 'menos', flat: 'estável' }

function Change({ change, suffix, empty = 'sem base de comparação' }) {
  if (!change) return <span className="text-content-muted">{empty}</span>
  const Icon = ICON[change.direction]
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${TONE[change.direction]}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {changeLabel(change)}
      {suffix && <span className="sr-only"> ({WORD[change.direction]}) {suffix}</span>}
    </span>
  )
}

/**
 * "Tendências · mês atual": gasto do mês contra o anterior e a média dos três
 * meses completos anteriores, e por categoria. A base (débito + parcelas de
 * cartão ainda em aberto) é outra que a do KPI "Total mensal", por isso o
 * card diz qual é.
 */
export default function SpendingTrends({ trends, loading, className = '' }) {
  const t = useMemo(() => buildTrends(trends ?? {}), [trends])

  return (
    <Card title="Tendências · mês atual" subtitle="Débito + parcelas de cartão em aberto" className={className} aria-busy={loading || undefined}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">Carregando tendências</span>
          <Skeleton shape="block" className="h-8 w-36" />
          <Skeleton lines={4} />
        </div>
      ) : !t.hasData ? (
        <EmptyState icon={ChartLine} title="Dados insuficientes" text="Registre gastos por alguns meses para ver as tendências." className="py-6" />
      ) : (
        <>
          <p className="text-[1.625rem] font-semibold leading-8 tracking-tight text-content-primary">
            <MoneyText value={t.current} />
          </p>
          <p className="mt-0.5 text-xs text-content-muted">Gasto do mês até hoje, comparado a meses inteiros</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Mês anterior', value: t.previous, change: t.vsPrevious },
              { label: 'Média de 3 meses', value: t.average, change: t.vsAverage },
            ].map((row) => (
              <div key={row.label} className="rounded-chip bg-surface-sunken px-3 py-2.5">
                <dt className="text-xs text-content-muted">{row.label}</dt>
                <dd className="mt-1 text-sm">
                  <MoneyText value={row.value} className="font-medium" />
                  <span className="mt-0.5 block text-xs">
                    <Change change={row.change} suffix={`em relação a ${row.label.toLowerCase()}`} />
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {t.categories.length > 0 && (
            <>
            <p className="mt-4 text-xs font-medium text-content-muted">Maiores categorias do mês</p>
            <ul className="mt-1 flex flex-col divide-y divide-line">
              {t.categories.slice(0, 5).map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-content-secondary">{c.name}</span>
                  <span className="flex shrink-0 items-baseline gap-3 text-xs">
                    <MoneyText value={c.current} tone="muted" />
                    <Change change={c.change} suffix="em relação ao mês anterior" empty={c.previous ? 'sem base de comparação' : 'sem gasto no mês anterior'} />
                  </span>
                </li>
              ))}
            </ul>
            </>
          )}
        </>
      )}
    </Card>
  )
}
