import { Link } from '@inertiajs/react'
import cx from '@/Components/ui/cx'

/**
 * Item do menu lateral.
 * - collapsed: só o ícone (o rótulo fica para leitor de tela e para a dica
 *   flutuante, que o Sidebar desenha via onHint/onHintEnd)
 * - badge: número de pendências (some quando é 0)
 */
export default function NavItem({ href, label, icon: Icon, active = false, collapsed = false, badge, onHint, onHintEnd, onClick }) {
  const count = Number(badge ?? 0)
  const showHint = (event) => collapsed && onHint?.(label, event.currentTarget)

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      onPointerEnter={showHint}
      onPointerLeave={onHintEnd}
      onFocus={showHint}
      onBlur={onHintEnd}
      className={cx(
        'themed-nav-item min-h-9 whitespace-nowrap py-1.5',
        active && 'themed-nav-item-active shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]',
        collapsed && 'justify-center px-0',
      )}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />}
      <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate'}>{label}</span>
      {count > 0 &&
        (collapsed ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-theme-accent" aria-hidden="true" />
        ) : (
          <span className="pill pill-accent tabular-nums">
            {count}
            <span className="sr-only"> pendentes</span>
          </span>
        ))}
    </Link>
  )
}
