import { useMemo } from 'react'
import { Banknote, CalendarClock, CreditCard, PiggyBank, Wallet } from 'lucide-react'
import { StatCard } from '@/Components/ui'
import { buildKpis } from '@/Lib/dashboard'

const ICONS = { fatura: CreditCard, debito: Banknote, total: Wallet, restante: PiggyBank, fechamento: CalendarClock }
const SLOTS = [
  ['fatura', 'Fatura atual'],
  ['debito', 'Transações no débito'],
  ['total', 'Total mensal'],
  ['restante', 'Dinheiro restante'],
  ['fechamento', 'Próximo fechamento'],
]

/** Linha dos cinco indicadores do mês, com esqueleto enquanto carrega. */
export default function DashboardKpis({ stats, loading }) {
  const kpis = useMemo(() => (stats ? buildKpis(stats) : []), [stats])

  return (
    <section aria-label="Resumo do mês" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-4">
      {loading || !stats
        ? SLOTS.map(([id, label]) => <StatCard key={id} label={label} icon={ICONS[id]} loading />)
        : kpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              label={kpi.label}
              icon={ICONS[kpi.id]}
              value={kpi.value}
              money={kpi.money}
              change={kpi.change}
              trend={kpi.trend}
              tone={kpi.tone}
              caption={kpi.caption}
            />
          ))}
    </section>
  )
}
