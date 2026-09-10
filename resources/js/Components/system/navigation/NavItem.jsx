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
      className={`group/navitem themed-nav-item whitespace-nowrap ${isActive ? 'themed-nav-item-active' : ''}`}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover/navitem:scale-110">
        <ThemedNavIcon
          type={type}
          size={size}
          className={collapsed ? 'rounded-full transition-colors duration-300 group-hover/navitem:bg-white group-hover/navitem:shadow-md dark:group-hover/navitem:bg-[#1c1c1c]' : ''}
        />

        {collapsed && (
          <span
            aria-hidden="true"
            className="absolute -inset-1 -z-10 rounded-full opacity-0 transition-opacity duration-300 [background:conic-gradient(from_45deg,var(--theme-accent),transparent_35%,transparent_65%,var(--theme-accent),transparent_100%)] group-hover/navitem:opacity-100 group-hover/navitem:animate-spin-slow"
          />
        )}
      </span>

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
