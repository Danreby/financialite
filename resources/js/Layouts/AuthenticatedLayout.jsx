import { useCallback, useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import Sidebar, { SIDEBAR_WIDTH } from '@/Components/system/navigation/Sidebar'
import Topbar from '@/Components/system/navigation/Topbar'
import NotificationSidebar from '@/Components/system/notification/NotificationSidebar'
import MobileNavOverlay from '@/Components/system/navigation/MobileNavOverlay'
import MobileBottomBar from '@/Components/system/navigation/MobileBottomBar'
import NewTransactionProvider from '@/Components/system/transactions/NewTransactionProvider'

const SIDEBAR_STORAGE_KEY = 'sidebar-open'
// Painel a 12 px da borda + largura + 12 px de respiro até o conteúdo.
const GUTTER = 12

function getStoredSidebarOpen() {
  if (typeof window === 'undefined') return true
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

export default function AuthenticatedLayout({ children }) {
  const user = usePage().props.auth.user
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarOpen)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen))
    } catch {
      //
    }
  }, [sidebarOpen])

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  const offset = (sidebarOpen ? SIDEBAR_WIDTH.open : SIDEBAR_WIDTH.closed) + GUTTER

  return (
    <NewTransactionProvider>
      <div className="surface-ground relative flex h-screen overflow-hidden text-content-primary" style={{ '--sidebar-offset': `${offset}px` }}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-chip focus:bg-surface-raised focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-content-primary focus:shadow-pop"
        >
          Pular para o conteúdo
        </a>

        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-200 ease-out motion-reduce:transition-none md:ml-[var(--sidebar-offset)]">
          <Topbar
            user={user}
            onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            mobileNavOpen={mobileNavOpen}
          />

          <main
            id="conteudo"
            tabIndex={-1}
            className="scrollbar-custom flex-1 overflow-y-auto overflow-x-hidden px-3 pb-24 pt-2 focus:outline-none sm:px-4 md:pb-6 md:pl-5 md:pr-6"
          >
            {children}
          </main>
        </div>

        <MobileBottomBar />

        <NotificationSidebar open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

        <MobileNavOverlay isOpen={mobileNavOpen} onClose={closeMobileNav} user={user} />
      </div>
    </NewTransactionProvider>
  )
}
