import { useMemo } from 'react'
import { Card, MoneyText, Skeleton } from '@/Components/ui'
import { buildForecast, formatPercent } from '@/Lib/dashboard'

const SWATCH = { invoice: 'bg-chart-1', bills: 'bg-chart-2', debit: 'bg-chart-4' }

/** "Previsão do mês": fatura pendente + contas do mês + débito, em uma barra dividida. */
export default function MonthlyForecastCard({ stats, loading, className = '' }) {
  const forecast = useMemo(() => buildForecast(stats ?? {}), [stats])
  const visible = forecast.parts.filter((p) => p.value > 0)

  return (
    <Card title="Previsão do mês" subtitle={loading ? 'Somando fatura, contas e débito' : `${forecast.monthLabel}: fatura, contas e débito`} className={className} aria-busy={loading || undefined}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">Carregando previsão</span>
          <Skeleton shape="block" className="h-8 w-40" />
          <Skeleton shape="block" className="h-2.5 w-full" />
          <Skeleton lines={2} />
        </div>
      ) : (
        <>
          <p className="text-[1.625rem] font-semibold leading-8 tracking-tight text-content-primary">
            <MoneyText value={forecast.total} />
          </p>
          <p className="mt-0.5 text-xs text-content-muted">previstos para sair até o fim do mês</p>

          {forecast.total > 0 ? (
            <>
              <div className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                {visible.map((p) => (
                  <span key={p.key} className={`h-full first:rounded-s-full last:rounded-e-full ${SWATCH[p.key]}`} style={{ width: `${p.share}%` }} />
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {forecast.parts.map((p) => (
                  <div key={p.key} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-content-muted">
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-sm ${SWATCH[p.key]}`} />
                      {p.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-content-primary">
                      <MoneyText value={p.value} />
                      <span className="ms-1.5 text-xs font-normal text-content-muted tabular-nums">{formatPercent(p.share)}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="mt-4 text-sm text-content-muted">Nenhuma fatura, conta ou compra no débito prevista para este mês.</p>
          )}
        </>
      )}
    </Card>
  )
}
