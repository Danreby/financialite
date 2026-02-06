import React from 'react'
import { motion } from 'framer-motion'

const STAT_ITEMS = [
  { key: 'member_since', label: 'Membro desde', icon: '📅', format: (v) => v || '—' },
  { key: 'banks_count', label: 'Bancos', icon: '🏦', format: (v) => String(v ?? 0) },
  { key: 'categories_count', label: 'Categorias', icon: '📂', format: (v) => String(v ?? 0) },
  { key: 'incomes_count', label: 'Rendas', icon: '💵', format: (v) => String(v ?? 0) },
  { key: 'transactions_count', label: 'Transações', icon: '💳', format: (v) => String(v ?? 0) },
]

export default function UserStatsCard({ stats = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0a0a0a]"
    >
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
        📊 Estatísticas da Conta
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-3 text-center dark:bg-[#0f0f0f]"
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {item.format(stats[item.key])}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
