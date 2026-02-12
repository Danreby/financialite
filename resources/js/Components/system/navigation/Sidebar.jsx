import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@inertiajs/react'
import ThemedNavIcon from '@/Components/common/ThemedNavIcon'

export default function Sidebar({ open: openProp = true, setOpen: setOpenProp }) {
  const [isOpen, setIsOpen] = useState(Boolean(openProp))

  useEffect(() => {
    setIsOpen(Boolean(openProp))
  }, [openProp])

  const notifyParent = (val) => {
    if (typeof setOpenProp === 'function') setOpenProp(val)
  }

  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)
    notifyParent(next)
  }

  const openIfClosed = () => {
    if (!isOpen) {
      setIsOpen(true)
      notifyParent(true)
    }
  }

  const onLogoKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openIfClosed()
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-shrink-0 h-screen border-r shadow-lg"
      style={{ 
        minWidth: 64, 
        width: isOpen ? 'fit-content' : 64,
        backgroundColor: 'var(--theme-bgSidebarLight)',
        borderColor: '#e5e5e5',
        boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.1), 1px 0 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      aria-expanded={isOpen}
    >
      <style>{`
        .dark aside {
          background-color: var(--theme-bgSidebarDark) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 1px 0 3px 0 rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <div
            role="button"
            tabIndex={0}
            onClick={openIfClosed}
            onKeyDown={onLogoKeyDown}
            aria-label={isOpen ? 'Brand' : 'Abrir sidebar'}
            className={`flex items-center gap-3 ${isOpen ? 'opacity-100' : 'justify-center'} cursor-pointer`}
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center ring-1 transition-all duration-150 themed-icon-wrapper">
              <img src="/favicon.ico" alt="" className="h-10 w-10" aria-hidden />
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  key="brand"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm font-semibold text-gray-900 select-none dark:text-gray-100"
                >
                  Financialite
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.button
                key="toggle-button"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                onClick={toggle}
                className="p-2 rounded-lg transition-all duration-150 themed-icon-wrapper"
                aria-label="Fechar sidebar"
                aria-pressed={isOpen}
                type="button"
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  style={{ color: 'inherit' }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <nav className="mt-3 flex-1 px-2 space-y-1">
          <NavItem type={8} open={isOpen} href={route('dashboard')} label="Dashboard" />
          <NavItem type={4} open={isOpen} href={route('transacoes.index')} label="Fatura" />
          <NavItem type={6} open={isOpen} href={route('accounts.index')} label="Contas" />
          <NavItem type={9} open={isOpen} href={route('transactions.index')} label="Transações" />
          <NavItem type={11} open={isOpen} href={route('extrato.index')} label="Extrato" />
          <NavItem type={10} open={isOpen} href={route('reports.index')} label="Relatórios" />
          <NavItem type={7} open={isOpen} href={route('about')} label="Sobre" />
        </nav>

        <nav className="px-2">
          <NavItem type={1} open={isOpen} href={route('settings')} label="Configurações" />
        </nav>

        <div className="px-3 py-4">
          <div className={`text-xs text-gray-500 ${isOpen ? '' : 'text-center'} dark:text-gray-400`}>
            © {new Date().getFullYear()} Finanças
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

function NavItem({ type = 3, size = 16, color, open, href, label }) {
  return (
    <Link
      href={href}
      className="themed-nav-item whitespace-nowrap"
    >
      <ThemedNavIcon type={type} size={size} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.14 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}
