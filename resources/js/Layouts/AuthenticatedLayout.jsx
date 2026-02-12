import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import Sidebar from '@/Components/system/navigation/Sidebar'
import Topbar from '@/Components/system/navigation/Topbar'
import NotificationSidebar from '@/Components/system/notification/NotificationSidebar'
import MobileNavOverlay from '@/Components/system/navigation/MobileNavOverlay'
import { ThemeProvider } from '@/Contexts/ThemeContext'

export default function AuthenticatedLayout({ children }) {
  const user = usePage().props.auth.user
  const initialTheme = user?.theme || 'rose'
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
  <ThemeProvider initialTheme={initialTheme}>
	<div className="h-screen flex overflow-hidden bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100">
    <div className="hidden lg:block">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
    </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

    		<main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 px-3 py-4 sm:px-4 lg:px-6 dark:bg-[#0a0a0a]">
          {children}
        </main>
      </div>

      <NotificationSidebar
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

	    <MobileNavOverlay
	      isOpen={mobileNavOpen}
	      onClose={() => setMobileNavOpen(false)}
	      user={user}
	    />
    </div>
  </ThemeProvider>
  )
}
