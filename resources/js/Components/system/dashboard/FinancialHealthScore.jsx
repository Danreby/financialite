import { HeartPulse, Lightbulb } from 'lucide-react'
import { Badge, Card, EmptyState, Skeleton } from '@/Components/ui'
import { FACTOR_STATUS, MISSING_DATA_LABELS, buildHealthFactors, healthRecommendation, scoreLabel } from '@/Lib/dashboard'

const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }

/**
 * "Saúde financeira": nota de 0 a 100 com a faixa escrita e os seis fatores,
 * cada um com valor e situação em texto (Bom, Regular, Atenção).
 */
export default function FinancialHealthScore({ health, loading, className = '' }) {
  const score = Math.min(Math.max(Number(health?.score) || 0, 0), 100)
  const missing = health?.missing_data ?? {}
  const missingList = Object.entries(missing).filter(([, v]) => v)
  const band = scoreLabel(score)
  const factors = buildHealthFactors(health?.factors, missing)

  return (
    <Card title="Saúde financeira" subtitle="Nota geral e o que pesa nela" className={className} aria-busy={loading || undefined}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">Carregando saúde financeira</span>
          <Skeleton shape="block" className="h-10 w-32" />
          <Skeleton lines={4} />
        </div>
      ) : !health?.has_data ? (
        <EmptyState
          icon={HeartPulse}
          title="Dados insuficientes"
          text={missingList.length ? missingList.map(([key]) => MISSING_DATA_LABELS[key]).join(', ') + ' para ver sua nota.' : 'Adicione dados financeiros para ver sua nota.'}
          className="py-6"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-[2.75rem] font-semibold leading-none tracking-tight text-content-primary tabular-nums">{Math.round(score)}</span>
              <span className="text-sm text-content-muted">de 100</span>
            </p>
            <Badge tone={band.tone} className="mt-3">
              {band.label}
            </Badge>
            <div
              role="meter"
              aria-label="Nota de saúde financeira"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(score)}
              aria-valuetext={`${Math.round(score)} de 100, ${band.label}`}
              className="mt-4 h-2 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line"
            >
              <div className={`h-full rounded-full ${BAR[band.tone]}`} style={{ width: `${score}%` }} />
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-chip bg-surface-sunken p-3 text-xs leading-5 text-content-secondary">
              <Lightbulb aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-theme-accent" />
              {healthRecommendation(score, health.factors, missing)}
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {factors.map((f) => {
              const status = f.status ? FACTOR_STATUS[f.status] : null
              return (
                <li key={f.key} className={f.disabled ? 'opacity-60' : undefined}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-content-secondary">{f.label}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold text-content-primary tabular-nums">{f.display}</span>
                      {status && <Badge tone={status.tone}>{status.label}</Badge>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                    {status && <div className={`h-full rounded-full ${BAR[status.tone]}`} style={{ width: `${f.ratio * 100}%` }} />}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {!loading && health?.has_data && missingList.length > 0 && (
        <p className="mt-4 text-xs text-content-muted">Para uma nota mais precisa: {missingList.map(([key]) => MISSING_DATA_LABELS[key]).join(', ')}.</p>
      )}
    </Card>
  )
}
