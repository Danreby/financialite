import { Link, usePage } from '@inertiajs/react'
import { ArrowLeftRight, House, Plus, ReceiptText } from 'lucide-react'
import cx from '@/Components/ui/cx'
import { isActivePath } from '@/Components/system/navigation/navConfig'
import { useNewTransaction } from '@/Components/system/transactions/NewTransactionProvider'
import { toPathname } from '@/Utils/url'

const SHORTCUTS = [
  { route: 'dashboard', label: 'Início', icon: House },
  { route: 'transactions.index', label: 'Transações', icon: ArrowLeftRight },
  { route: 'transacoes.index', label: 'Fatura', icon: ReceiptText },
]

const itemClass =
  'flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-chip text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent'

/** Barra inferior do celular com os 4 atalhos do dia a dia. */
export default function MobileBottomBar() {
  const { url } = usePage()
  const currentPath = toPathname(url)
  const { openNewTransaction } = useNewTransaction()

  return (
    <nav
      aria-label="Atalhos"
      className="surface-panel fixed inset-x-2 bottom-2 z-30 flex items-stretch gap-1 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {SHORTCUTS.map(({ route: name, label, icon: Icon }) => {
        const active = isActivePath(currentPath, name)
        return (
          <Link
            key={name}
            href={route(name)}
            aria-current={active ? 'page' : undefined}
            className={cx(itemClass, active ? 'bg-theme-accent-soft text-theme-accent' : 'text-content-muted hover:text-content-primary')}
          >
            <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.75} />
            {label}
          </Link>
        )
      })}
      <button type="button" onClick={openNewTransaction} aria-keyshortcuts="N" className={cx(itemClass, 'text-content-primary')}>
        <span className="-my-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-theme-accent text-[rgb(var(--on-accent))]" aria-hidden="true">
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </span>
        Nova
        <span className="sr-only"> despesa</span>
      </button>
    </nav>
  )
}
