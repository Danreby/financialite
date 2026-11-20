import { useMemo } from 'react'
import { BellOff, CalendarClock, CreditCard, HeartPulse, Target } from 'lucide-react'
import { AlertItem, Button, Card, EmptyState, Skeleton } from '@/Components/ui'
import { deriveAlerts } from '@/Lib/dashboard'

const ICONS = { budget: Target, bill: CalendarClock, card: CreditCard, health: HeartPulse }

/**
 * "Alertas do mês" (a coluna de alertas da referência), montados só com os
 * dados do painel: orçamento estourado, conta vencendo, fatura fechando e
 * fatores da saúde financeira em atenção. Regras em Lib/dashboard.deriveAlerts.
 */
export default function MonthAlerts({ stats, insights, loading, onPayBill, className = '' }) {
  const alerts = useMemo(
    () =>
      stats && insights
        ? deriveAlerts({
            budgetProgress: insights.budget_progress,
            bills: insights.upcoming_bills,
            nextDueInfo: stats.next_card_due_date,
            health: insights.financial_health,
          })
        : [],
    [stats, insights],
  )

  const high = alerts.filter((a) => a.priority === 'alta').length
  const subtitle = loading
    ? 'Conferindo orçamento, contas e faturas'
    : alerts.length
      ? `${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'}${high ? `, ${high} de prioridade alta` : ''}`
      : 'Orçamento, contas, faturas e saúde financeira'

  return (
    <Card title="Alertas do mês" subtitle={subtitle} className={className} bodyClassName="flex min-h-0 flex-1 flex-col" aria-busy={loading || undefined}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">Carregando alertas</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} shape="block" className="h-24 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="Nada pedindo atenção" text="Nenhum orçamento estourado, conta vencendo ou fatura fechando nos próximos dias." />
      ) : (
        <ul tabIndex={0} aria-label="Lista de alertas" className="scrollbar-custom -me-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-chip pe-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <AlertItem
                title={alert.title}
                priority={alert.priority}
                description={alert.description}
                detail={alert.detail}
                detailIcon={ICONS[alert.icon]}
                action={
                  alert.bill?.can_pay && onPayBill ? (
                    <Button size="sm" variant="secondary" aria-label={`Pagar conta: ${alert.bill.title}`} onClick={() => onPayBill(alert.bill)}>
                      Pagar conta
                    </Button>
                  ) : null
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
