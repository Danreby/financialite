import React from 'react'
import { Link } from '@inertiajs/react'
import { AnimatePresence, motion } from 'framer-motion'
import BareButton from '@/Components/common/buttons/BareButton'
import ThemedNavIcon from '@/Components/common/ThemedNavIcon'

const links = [
  { href: () => route('dashboard'), label: 'Dashboard', icon: 8 },
  { href: () => route('transacoes.index'), label: 'Fatura', icon: 4 },
  { href: () => route('accounts.index'), label: 'Cartões', icon: 12 },
  { href: () => route('categorias.index'), label: 'Categorias', icon: 13 },
  { href: () => route('bancos.index'), label: 'Bancos', icon: 5 },
  { href: () => route('parcelamentos.index'), label: 'Parcelamentos', icon: 14 },
  { href: () => route('transactions.index'), label: 'Transações', icon: 9 },
  { href: () => route('contas.index'), label: 'Contas', icon: 6 },
  { href: () => route('extrato.index'), label: 'Extrato', icon: 11 },
  { href: () => route('resumo-mensal.index'), label: 'Resumo Mensal', icon: 16 },
  { href: () => route('reports.index'), label: 'Relatórios', icon: 10 },
  { href: () => route('projecao.index'), label: 'Projeção', icon: 15 },
  { href: () => route('about'), label: 'Sobre', icon: 7 },
  { href: () => route('settings'), label: 'Configurações', icon: 1 },
]

export default function MobileNavOverlay({ isOpen, onClose, user }) {
  const initials = (() => {
    if (!user?.name) return 'U'
    const parts = user.name
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)

    if (parts.length === 0) return 'U'

    return parts
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  })()

  const handleNavigate = (hrefFactory) => {
    const url = hrefFactory()
    onClose?.()
    window.location.href = url
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col bg-white/90 text-gray-900 dark:bg-[#050505]/95 dark:text-gray-100 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full themed-avatar flex items-center justify-center text-sm font-semibold ring-1 ring-gray-200 dark:ring-white/20">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">
                  {user?.name || 'Usuário'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-300 truncate max-w-[180px]">
                  {user?.email}
                </span>
              </div>
            </div>

            <BareButton
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Fechar menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </BareButton>
          </div>

          <motion.nav
            className="flex-1 overflow-y-auto overscroll-contain scrollbar-custom px-3 py-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-2 gap-2">
              {links.map((item, index) => (
                <motion.button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-gray-900/5 text-gray-900 hover:bg-gray-900/10 active:bg-gray-900/15 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10 dark:active:bg-white/15 text-sm font-medium transition-colors"
                >
                  <ThemedNavIcon type={item.icon} size={15} />
                  <span className="truncate">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.nav>

          <div className="px-4 pb-5 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-300">
            {/* <span>© {new Date().getFullYear()} Finanças</span> */}
            <Link
              href={route('logout')}
              method="post"
              as="button"
              className="text-red-500 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200 font-medium"
            >
              Sair
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
