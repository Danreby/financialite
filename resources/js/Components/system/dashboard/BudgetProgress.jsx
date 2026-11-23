import { Settings, Target } from 'lucide-react'
import { Badge, Button, Card, EmptyState, MoneyText, ProgressBar, Skeleton } from '@/Components/ui'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { formatPercent } from '@/Lib/dashboard'

const num = (v) => Number(v) || 0

function budgetText(spent, limit) {
  if (limit <= 0) return 'Sem limite'
  if (spent > limit) return `${formatCurrencyBRL(spent - limit)} acima do planejado`
  return `${formatPercent((spent / limit) * 100)} usado`
}

/** "Orçamentos": total do mês e uma barra por categoria; passar do limite vira texto, não só cor. */
export default function BudgetProgress({ progress, loading, onConfigure, className = '' }) {
  const total = num(progress?.total_budget)
  const spent = num(progress?.total_spent)
  const budgets = progress?.budgets ?? []
  const over = total > 0 && spent > total

  const configure = (
    <Button size="sm" variant="ghost" icon={Settings} onClick={onConfigure}>
      Configurar
    </Button>
  )

  return (
    <Card title="Orçamentos" subtitle="Limites do mês por categoria" actions={!loading && onConfigure ? configure : null} className={className} aria-busy={loading || undefined}>
      {loading ? (
        <div className="flex flex-col gap-4">
          <span className="sr-only">Carregando orçamentos</span>
          <Skeleton shape="block" className="h-8 w-44" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} lines={2} />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState icon={Target} title="Sem orçamento definido" text="Defina limites por categoria para saber quando um gasto passa do planejado." action={onConfigure ? configure : null} className="py-6" />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[1.375rem] font-semibold leading-7 tracking-tight text-content-primary">
              <MoneyText value={spent} />
              <span className="ms-1.5 text-sm font-normal text-content-muted">de <MoneyText value={total} tone="muted" /></span>
            </p>
            {over ? <Badge tone="danger">Acima do planejado</Badge> : <Badge tone="success">Dentro do planejado</Badge>}
          </div>
          <ProgressBar value={spent} max={total} showValue={false} aria-label="Orçamento total do mês" valueText={budgetText(spent, total)} className="mt-3" />
          <p className={`mt-1.5 text-xs ${over ? 'font-semibold text-danger-strong' : 'text-content-muted'}`}>
            {over ? budgetText(spent, total) : `${formatCurrencyBRL(total - spent)} livres até o fim do mês`}
          </p>

          {budgets.length > 0 && (
            <ul className="mt-5 flex flex-col gap-3.5 border-t border-line pt-4">
              {budgets.map((b) => {
                const limit = num(b.limit)
                const used = num(b.spent)
                return (
                  <li key={b.categoryName}>
                    <ProgressBar
                      value={used}
                      max={limit}
                      size="sm"
                      label={b.categoryName || 'Sem categoria'}
                      aria-label={`${b.categoryName || 'Sem categoria'}: ${formatCurrencyBRL(used)} de ${formatCurrencyBRL(limit)}`}
                      valueText={budgetText(used, limit)}
                    />
                    <p className="mt-1 text-xs text-content-muted tabular-nums">
                      {formatCurrencyBRL(used)} de {formatCurrencyBRL(limit)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Card>
  )
}
