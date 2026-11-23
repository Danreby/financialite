import { CalendarCheck, Pencil, Plus, Power } from 'lucide-react'
import { Badge, Button, Card, EmptyState, MoneyText, Skeleton } from '@/Components/ui'
import { daysUntil, relativeDays, shortDate } from '@/Lib/dashboard'

function dueBadge(bill, days) {
  if (bill.is_overdue || bill.status === 'overdue' || days < 0) return { tone: 'danger', text: `Vencida ${relativeDays(days)}` }
  if (days === 0) return { tone: 'danger', text: 'Vence hoje' }
  if (days <= 3) return { tone: 'warning', text: `Vence ${relativeDays(days)}` }
  return { tone: 'neutral', text: `Vence ${relativeDays(days)}` }
}

/** "Próximas contas": contas não pagas por ordem de vencimento, com Pagar, Editar e Desativar. */
export default function UpcomingBills({ bills = [], loading, onPay, onEdit, onAdd, onToggle, className = '' }) {
  const unpaid = bills.filter((b) => b.status !== 'paid')
  const overdue = unpaid.filter((b) => b.is_overdue || b.status === 'overdue')
  const toPay = unpaid.filter((b) => !(b.is_overdue || b.status === 'overdue')).reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

  const subtitle = loading
    ? 'Carregando contas'
    : unpaid.length
      ? `${unpaid.length} em aberto${overdue.length ? `, ${overdue.length} ${overdue.length === 1 ? 'vencida' : 'vencidas'}` : ''}`
      : 'Contas a pagar dos próximos dias'

  return (
    <Card
      title="Próximas contas"
      subtitle={subtitle}
      actions={onAdd ? <Button size="sm" variant="ghost" icon={Plus} onClick={onAdd}>Adicionar</Button> : null}
      className={className}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          <span className="sr-only">Carregando contas</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} shape="block" className="h-16 w-full" />
          ))}
        </div>
      ) : unpaid.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Nenhuma conta em aberto" text="As contas aparecem aqui quando o vencimento se aproxima." className="py-6" />
      ) : (
        <>
          {toPay > 0 && (
            <p className="mb-3 flex items-baseline justify-between gap-3 rounded-chip bg-surface-sunken px-3 py-2.5 text-xs text-content-muted">
              A pagar nos próximos dias
              <MoneyText value={toPay} className="text-base font-semibold" />
            </p>
          )}
          <ul className="flex flex-col divide-y divide-line">
            {unpaid.map((bill) => {
              const date = bill.date || bill.due_date
              const badge = dueBadge(bill, daysUntil(date))
              const name = bill.title || bill.description || 'Conta sem nome'
              return (
                <li key={`${bill.id}-${date}`} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-content-primary">{name}</p>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {shortDate(date)}
                        {bill.category_name ? ` · ${bill.category_name}` : ''}
                        {bill.recurring ? ' · mensal' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {Number(bill.amount) > 0 ? <MoneyText value={bill.amount} className="text-sm font-semibold" /> : <span className="text-sm text-content-muted">A definir</span>}
                      <Badge tone={badge.tone}>{badge.text}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {bill.can_pay && onPay && (
                      <Button size="sm" variant="secondary" onClick={() => onPay(bill)} aria-label={`Pagar ${name}`}>
                        Pagar
                      </Button>
                    )}
                    {onEdit && <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${name}`} onClick={() => onEdit(bill)} />}
                    {onToggle && <Button size="sm" variant="ghost" iconOnly icon={Power} aria-label={`Desativar ${name}`} onClick={() => onToggle(bill)} />}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Card>
  )
}
