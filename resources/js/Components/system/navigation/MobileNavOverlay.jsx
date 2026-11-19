import { useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LogOut, X } from 'lucide-react'
import { Button } from '@/Components/ui'
import NavItem from '@/Components/system/navigation/NavItem'
import { initialsOf, isActivePath, visibleFooter, visibleGroups } from '@/Components/system/navigation/navConfig'
import { useFocusTrap } from '@/Hooks/useFocusTrap'
import { toPathname } from '@/Utils/url'

/**
 * Gaveta de navegação do celular: diálogo modal com foco preso, Esc fecha,
 * clique no fundo fecha e o foco volta para o botão que abriu.
 */
export default function MobileNavOverlay({ isOpen, onClose, user }) {
  const { url } = usePage()
  const currentPath = toPathname(url)
  const reduceMotion = useReducedMotion()
  const { containerRef } = useFocusTrap(isOpen, { onEscape: onClose })

  useEffect(() => {
    if (!isOpen) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  const groups = visibleGroups()
  const footer = visibleFooter()

  const renderItem = (item) => (
    <li key={item.route}>
      <NavItem href={route(item.route)} label={item.label} icon={item.icon} active={isActivePath(currentPath, item.route)} onClick={onClose} />
    </li>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            tabIndex={-1}
            className="surface-panel absolute bottom-2 left-2 top-2 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-hidden"
            initial={reduceMotion ? { opacity: 0 } : { x: '-104%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '-104%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
              <span className="flex items-center gap-2.5">
                <img src="/favicon.ico" alt="" className="h-8 w-8 rounded-lg" aria-hidden="true" />
                <span className="text-[15px] font-semibold tracking-tight text-content-primary">Financialite</span>
              </span>
              <Button variant="ghost" iconOnly icon={X} onClick={onClose} aria-label="Fechar menu" className="text-content-secondary" />
            </div>

            <nav aria-label="Páginas" className="scrollbar-custom flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
              {groups.map((group, index) => (
                <div key={group.id} className={index > 0 ? 'mt-4' : undefined}>
                  <h2 className="mb-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-content-muted">{group.label}</h2>
                  <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
                </div>
              ))}
              <ul className="mt-4 space-y-0.5 border-t border-line pt-3">{footer.map(renderItem)}</ul>
            </nav>

            <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
              <span className="themed-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" aria-hidden="true">
                {initialsOf(user?.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content-primary">{user?.name || 'Usuário'}</span>
                <span className="block truncate text-xs text-content-muted">{user?.email}</span>
              </span>
              <Button as={Link} href={route('logout')} method="post" variant="ghost" size="sm" icon={LogOut} className="text-danger-strong">
                Sair
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
