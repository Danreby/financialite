import { useCallback, useEffect, useId, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import { Button, Kbd } from '@/Components/ui'
import cx from '@/Components/ui/cx'
import NavItem from '@/Components/system/navigation/NavItem'
import { initialsOf, isActivePath, visibleFooter, visibleGroups } from '@/Components/system/navigation/navConfig'
import { useNewTransaction } from '@/Components/system/transactions/NewTransactionProvider'
import { toPathname } from '@/Utils/url'

const GROUPS_STORAGE_KEY = 'sidebar-groups'

function readCollapsedGroups() {
  try {
    const raw = window.localStorage.getItem(GROUPS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const SIDEBAR_WIDTH = { open: 248, closed: 76 }

/**
 * Menu lateral em painel próprio (.surface-panel) flutuando dentro da página.
 * Recolhe para só ícones (estado salvo em `sidebar-open` pelo layout) e cada
 * grupo recolhe sozinho (estado salvo em `sidebar-groups`).
 */
export default function Sidebar({ open = true, setOpen, badges = {} }) {
  const { url, props } = usePage()
  const user = props.auth?.user
  const currentPath = toPathname(url)
  const { openNewTransaction } = useNewTransaction()
  const idPrefix = useId()

  const [collapsedGroups, setCollapsedGroups] = useState(readCollapsedGroups)
  const [hint, setHint] = useState(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(collapsedGroups))
    } catch {
      //
    }
  }, [collapsedGroups])

  useEffect(() => {
    if (open) setHint(null)
  }, [open])

  // O grupo da página atual sempre abre (e o estado salvo passa a refletir isso).
  useEffect(() => {
    const activeGroup = visibleGroups().find((group) => group.items.some((item) => isActivePath(currentPath, item.route)))
    if (activeGroup) {
      setCollapsedGroups((prev) => (prev[activeGroup.id] ? { ...prev, [activeGroup.id]: false } : prev))
    }
  }, [currentPath])

  const showHint = useCallback((label, element) => {
    const rect = element.getBoundingClientRect()
    setHint({ label, top: rect.top + rect.height / 2, left: rect.right + 12 })
  }, [])
  const hideHint = useCallback(() => setHint(null), [])

  const groups = visibleGroups()
  const footer = visibleFooter()
  const collapsed = !open
  const settingsActive = isActivePath(currentPath, 'settings')

  const renderItem = (item) => (
    <li key={item.route}>
      <NavItem
        href={route(item.route)}
        label={item.label}
        icon={item.icon}
        active={isActivePath(currentPath, item.route)}
        collapsed={collapsed}
        badge={badges[item.route]}
        onHint={showHint}
        onHintEnd={hideHint}
      />
    </li>
  )

  return (
    <aside
      aria-label="Menu principal"
      style={{ width: open ? SIDEBAR_WIDTH.open : SIDEBAR_WIDTH.closed }}
      className="surface-panel fixed bottom-3 left-3 top-3 z-30 flex flex-col overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
    >
      <div className={cx('flex items-center gap-2 px-3 pb-2 pt-3', collapsed ? 'flex-col' : 'justify-between pl-4')}>
        <Link
          href={route('dashboard')}
          className="flex min-w-0 items-center gap-2.5 rounded-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
          aria-label={collapsed ? 'Financialite, ir para o Dashboard' : undefined}
        >
          <img src="/favicon.ico" alt="" className="h-8 w-8 shrink-0 rounded-lg" aria-hidden="true" />
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight text-content-primary">Financialite</span>}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          onClick={() => setOpen?.(!open)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={open}
          className="text-content-muted"
        />
      </div>

      <nav aria-label="Páginas" className="scrollbar-custom flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
        {groups.map((group, index) => {
          const listId = `${idPrefix}-${group.id}`
          const groupCollapsed = !collapsed && Boolean(collapsedGroups[group.id])
          return (
            <div key={group.id} className={cx(index > 0 && (collapsed ? 'mt-2 border-t border-line pt-2' : 'mt-2'))}>
              {!collapsed && (
                <h2 className="mb-1">
                  <button
                    type="button"
                    aria-expanded={!groupCollapsed}
                    aria-controls={listId}
                    onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-content-muted transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
                  >
                    {group.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cx('h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none', groupCollapsed && '-rotate-90')}
                    />
                  </button>
                </h2>
              )}
              <ul id={listId} hidden={groupCollapsed} className="space-y-0.5" aria-label={collapsed ? group.label : undefined}>
                {group.items.map(renderItem)}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-line px-3 pb-3 pt-2">
        <ul className="space-y-0.5" aria-label="Ajustes">
          {footer.map(renderItem)}
        </ul>

        {collapsed ? (
          <div className="flex justify-center">
            <Button
              iconOnly
              icon={Plus}
              onClick={openNewTransaction}
              aria-label="Nova despesa"
              aria-keyshortcuts="N"
              onPointerEnter={(event) => showHint('Nova despesa (N)', event.currentTarget)}
              onPointerLeave={hideHint}
              onFocus={(event) => showHint('Nova despesa (N)', event.currentTarget)}
              onBlur={hideHint}
            />
          </div>
        ) : (
          <div className="rounded-[14px] border border-line bg-surface-sunken p-3">
            <p className="text-sm font-semibold text-content-primary">Nova despesa</p>
            <p className="sidebar-card-text mt-0.5 text-xs leading-snug text-content-muted">
              Registre um gasto no débito ou no crédito. Atalho <Kbd className="ml-0.5 h-[18px] px-1">N</Kbd>
            </p>
            <Button size="sm" icon={Plus} onClick={openNewTransaction} aria-keyshortcuts="N" className="mt-2.5 w-full">
              Registrar despesa
            </Button>
          </div>
        )}

        {user && (
          <Link
            href={route('settings')}
            aria-current={settingsActive ? 'page' : undefined}
            aria-label={collapsed ? `${user.name}, abrir configurações` : undefined}
            onPointerEnter={(event) => collapsed && showHint(user.name, event.currentTarget)}
            onPointerLeave={hideHint}
            onFocus={(event) => collapsed && showHint(user.name, event.currentTarget)}
            onBlur={hideHint}
            className={cx(
              'flex items-center gap-2.5 rounded-chip p-1.5 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent',
              collapsed && 'justify-center',
            )}
          >
            <span className="themed-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" aria-hidden="true">
              {initialsOf(user.name)}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content-primary">{user.name}</span>
                <span className="block truncate text-xs text-content-muted">{user.email}</span>
              </span>
            )}
          </Link>
        )}
      </div>

      {collapsed && hint && (
        <span
          role="presentation"
          style={{ top: hint.top, left: hint.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-chip border border-line bg-surface-raised px-2.5 py-1 text-xs font-semibold text-content-primary shadow-pop"
        >
          {hint.label}
        </span>
      )}
    </aside>
  )
}
