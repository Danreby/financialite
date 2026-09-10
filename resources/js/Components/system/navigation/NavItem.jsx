import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from '@inertiajs/react'
import ThemedNavIcon from '@/Components/common/ThemedNavIcon'
import { toPathname } from '@/Utils/url'

export default function NavItem({ type = 3, size = 16, open, href, label, currentPath }) {
  const isActive = currentPath === toPathname(href)
  const collapsed = !open

  return (
    <Link
      href={href}
      className={`group/navitem themed-nav-item whitespace-nowrap ${isActive ? 'themed-nav-item-active' : ''} ${collapsed ? '!gap-0 !p-0 overflow-visible' : ''}`}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {collapsed ? (
        <span
          className={`relative z-10 flex h-10 w-full items-center justify-center transition-all duration-200 ease-in-out hover:w-[130%] hover:rounded-r-lg ${
            isActive ? 'bg-theme-accent' : 'bg-theme-primary'
          }`}
        >
          <ThemedNavIcon type={type} size={size} color="#fff" />
        </span>
      ) : (
        <ThemedNavIcon type={type} size={size} />
      )}

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

      {collapsed && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-x-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-black/10 bg-white px-2.5 py-1 text-sm font-semibold capitalize text-gray-900 opacity-0 shadow-lg transition-all duration-300 group-hover/navitem:translate-x-0 group-hover/navitem:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-gray-100"
        >
          {label}
        </span>
      )}
    </Link>
  )
}
