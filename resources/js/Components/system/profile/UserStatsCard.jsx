import React from 'react'
import { motion } from 'framer-motion'

const STAT_ITEMS = [
  {
    key: 'banks_count',
    label: 'Bancos',
    icon: '🏦',
    format: (v) => String(v ?? 0),
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  {
    key: 'categories_count',
    label: 'Categorias',
    icon: '📂',
    format: (v) => String(v ?? 0),
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
  {
    key: 'incomes_count',
    label: 'Rendas ativas',
    icon: '💵',
    format: (v) => String(v ?? 0),
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  {
    key: 'savings_goals_count',
    label: 'Metas',
    icon: '🎯',
    format: (v) => String(v ?? 0),
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    key: 'transactions_count',
    label: 'Transações',
    icon: '💳',
    format: (v) => Number(v ?? 0).toLocaleString('pt-BR'),
    color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-200 dark:ring-rose-800',
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function UserStatsCard({ stats = {} }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
    >
      {STAT_ITEMS.map((s) => (
        <motion.div
          key={s.key}
          variants={item}
          className={`rounded-2xl p-4 ring-1 shadow-sm themed-card flex items-center gap-3 ${s.ring}`}
        >
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${s.color}`}>
            <span className="text-xl">{s.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-none mb-0.5">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">
              {s.format(stats[s.key])}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
