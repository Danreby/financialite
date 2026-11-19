import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import { Bell, LogOut, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { Button, Kbd, SearchInput } from '@/Components/ui'
import cx from '@/Components/ui/cx'
import { useTheme } from '@/Contexts/ThemeContext'
import CommandPalette from '@/Components/system/navigation/CommandPalette'
import { currentPageLabel, initialsOf } from '@/Components/system/navigation/navConfig'
import { useNewTransaction } from '@/Components/system/transactions/NewTransactionProvider'
import { toPathname } from '@/Utils/url'

const isMacPlatform = () => {
  if (typeof navigator === 'undefined') return false
  const platform = navigator.userAgentData?.platform || navigator.platform || ''
  return /mac|iphone|ipad/i.test(platform)
}

const menuItemClass =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content-primary focus-visible:bg-surface-sunken focus-visible:text-content-primary focus-visible:outline-none'

/**
 * Topo do app. No computador: busca (abre a paleta de comandos, Ctrl/⌘ K),
 * sino, tema e menu do usuário. No celular: botão do menu, nome da página
 * e os mesmos ícones.
 */
export default function Topbar({ user, onToggleNotifications, onOpenMobileNav, mobileNavOpen = false }) {
  const { url, props } = usePage()
  const initialUnread = Number(props.unreadNotificationCount ?? 0)
  const { isDark, toggleColorMode } = useTheme()
  const { openNewTransaction } = useNewTransaction()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [palette, setPalette] = useState({ open: false, query: '' })
  const [isMac] = useState(isMacPlatform)
  const userMenuRef = useRef(null)
  const userButtonRef = useRef(null)
  const lastInertiaUnreadRef = useRef(initialUnread)

  const pageLabel = currentPageLabel(toPathname(url))

  useEffect(() => {
    if (initialUnread !== lastInertiaUnreadRef.current) {
      lastInertiaUnreadRef.current = initialUnread
      setUnreadCount(initialUnread)
    }
  }, [initialUnread])

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (document.hidden) return
      try {
        const response = await axios.get(route('notifications.unread-count'))
        setUnreadCount(Number(response.data?.unread_count || 0))
      } catch {
        //
      }
    }
    const interval = setInterval(fetchUnreadCount, 90_000)
    document.addEventListener('visibilitychange', fetchUnreadCount)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', fetchUnreadCount)
    }
  }, [])

  const openPalette = useCallback((query = '') => setPalette({ open: true, query }), [])
  const closePalette = useCallback(() => setPalette((prev) => ({ ...prev, open: false })), [])

  // Ctrl/⌘ K abre (ou fecha) a paleta de qualquer lugar, inclusive de dentro de campos.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
      if (!palette.open && document.querySelector('[role="dialog"][aria-modal="true"]')) return
      event.preventDefault()
      setPalette((prev) => ({ open: !prev.open, query: '' }))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [palette.open])

  useEffect(() => {
    if (!userMenuOpen) return undefined
    const menu = userMenuRef.current
    menu?.querySelector('[role="menuitem"]')?.focus()

    const onPointerDown = (event) => {
      if (menu && !menu.contains(event.target) && !userButtonRef.current?.contains(event.target)) setUserMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (!menu) return
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]'))
      const index = items.indexOf(document.activeElement)
      if (event.key === 'Escape') {
        event.preventDefault()
        setUserMenuOpen(false)
        userButtonRef.current?.focus()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        items[(index + 1) % items.length]?.focus()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        items[(index - 1 + items.length) % items.length]?.focus()
      } else if (event.key === 'Tab') {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

  const onSearchKeyDown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault()
      openPalette('')
    } else if (event.key.length === 1) {
      event.preventDefault()
      openPalette(event.key)
    }
  }

  const iconButton = 'text-content-secondary'

  return (
    <header className="flex items-center gap-2 px-3 pb-2 pt-3 sm:px-4 md:gap-3 md:pl-5 md:pr-6 md:pt-3">
      <Button
        variant="ghost"
        iconOnly
        icon={Menu}
        onClick={onOpenMobileNav}
        aria-label="Abrir menu"
        aria-expanded={mobileNavOpen}
        aria-haspopup="dialog"
        className={cx(iconButton, '-ml-1 md:hidden')}
      />
      <p className="min-w-0 flex-1 truncate text-base font-semibold text-content-primary md:hidden">{pageLabel}</p>

      <div
        className="hidden w-full max-w-sm md:block"
        onMouseDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          openPalette('')
        }}
      >
        <SearchInput
          readOnly
          placeholder="Buscar páginas e ações"
          aria-label="Buscar páginas e ações"
          aria-haspopup="dialog"
          aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
          trailing={<Kbd>{isMac ? '⌘ K' : 'Ctrl K'}</Kbd>}
          onKeyDown={onSearchKeyDown}
          className="cursor-pointer [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <span className="relative inline-flex">
          <Button
            variant="ghost"
            iconOnly
            icon={Bell}
            onClick={() => {
              onToggleNotifications()
              setUnreadCount(0)
            }}
            aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
            className={iconButton}
          />
          {unreadCount > 0 && (
            <span
              className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-theme-accent ring-2 ring-[rgb(var(--surface-base))]"
              aria-hidden="true"
            />
          )}
        </span>

        <Button
          variant="ghost"
          iconOnly
          icon={isDark ? Sun : Moon}
          onClick={toggleColorMode}
          aria-label={isDark ? 'Usar modo claro' : 'Usar modo escuro'}
          className={iconButton}
        />

        <div className="relative">
          <button
            ref={userButtonRef}
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label={`Menu de ${user?.name ?? 'usuário'}`}
            className="themed-avatar ml-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-transparent transition-shadow hover:ring-line-strong focus-visible:outline-none focus-visible:ring-theme-accent"
          >
            {initialsOf(user?.name)}
          </button>

          {userMenuOpen && (
            <div
              ref={userMenuRef}
              role="menu"
              aria-label="Menu do usuário"
              className="surface-card absolute right-0 z-40 mt-2 w-60 overflow-hidden py-1 shadow-pop"
            >
              <div className="border-b border-line px-3 pb-2 pt-1.5" role="none">
                <p className="truncate text-sm font-semibold text-content-primary">{user?.name}</p>
                <p className="truncate text-xs text-content-muted">{user?.email}</p>
              </div>
              <Link href={route('profile.edit')} role="menuitem" tabIndex={-1} className={menuItemClass} onClick={() => setUserMenuOpen(false)}>
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Perfil
              </Link>
              <Link href={route('settings')} role="menuitem" tabIndex={-1} className={menuItemClass} onClick={() => setUserMenuOpen(false)}>
                <Settings className="h-4 w-4" aria-hidden="true" />
                Configurações
              </Link>
              <Link
                href={route('logout')}
                method="post"
                as="button"
                role="menuitem"
                tabIndex={-1}
                className={cx(menuItemClass, 'text-danger-strong hover:text-danger-strong focus-visible:text-danger-strong')}
                onClick={() => setUserMenuOpen(false)}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </Link>
            </div>
          )}
        </div>
      </div>

      <CommandPalette open={palette.open} initialQuery={palette.query} onClose={closePalette} onNewTransaction={openNewTransaction} />
    </header>
  )
}
