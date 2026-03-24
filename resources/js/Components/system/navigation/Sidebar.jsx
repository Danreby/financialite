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
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={toggle}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -220,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen border-r shadow-2xl z-40"
        style={{ 
          width: 220,
          backgroundColor: 'var(--theme-bgSidebarLight)',
          borderColor: '#e5e5e5',
          boxShadow: '2px 0 10px 0 rgba(0, 0, 0, 0.15)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        aria-expanded={isOpen}
      >
        <style>{`
          .dark aside {
            background-color: var(--theme-bgSidebarDark) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 2px 0 10px 0 rgba(0, 0, 0, 0.4) !important;
          }
        `}</style>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <div
            role="button"
            tabIndex={0}
            onClick={isOpen ? toggle : openIfClosed}
            onKeyDown={onLogoKeyDown}
            aria-label={isOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
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
        </div>

        <nav className="mt-3 flex-1 px-2 space-y-1">
          <NavItem type={8} open={isOpen} href={route('dashboard')} label="Dashboard" />
          <NavItem type={4} open={isOpen} href={route('transacoes.index')} label="Fatura" />
          <NavItem type={12} open={isOpen} href={route('accounts.index')} label="Cartões" />
          <NavItem type={13} open={isOpen} href={route('categorias.index')} label="Categorias" />
          <NavItem type={5} open={isOpen} href={route('bancos.index')} label="Bancos" />
          <NavItem type={14} open={isOpen} href={route('parcelamentos.index')} label="Parcelamentos" />
          <NavItem type={9} open={isOpen} href={route('transactions.index')} label="Transações" />
          <NavItem type={6} open={isOpen} href={route('contas.index')} label="Contas" />
          <NavItem type={11} open={isOpen} href={route('extrato.index')} label="Extrato" />
          <NavItem type={16} open={isOpen} href={route('resumo-mensal.index')} label="Resumo Mensal" />
          <NavItem type={17} open={isOpen} href={route('receitas.index')} label="Receitas" />
          <NavItem type={10} open={isOpen} href={route('reports.index')} label="Relatórios" />
          <NavItem type={15} open={isOpen} href={route('projecao.index')} label="Projeção" />
          <NavItem type={7} open={isOpen} href={route('about')} label="Sobre" />
        </nav>

        <nav className="px-2">
          <NavItem type={1} open={isOpen} href={route('settings')} label="Configurações" />
        </nav>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-4"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {/* © {new Date().getFullYear()} Finanças */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
    </>
  )
}

function NavItem({ type = 3, size = 16, color, open, href, label }) {
  return (
    <Link
      href={href}
      className="themed-nav-item whitespace-nowrap"
      title={!open ? label : undefined}
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
