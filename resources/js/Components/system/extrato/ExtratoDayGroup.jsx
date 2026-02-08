import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ExtratoTransactionRow from './ExtratoTransactionRow'
import { formatCurrencyBRL } from '@/Lib/formatters'

/**
 * Grupo de transações por dia com collapse
 * Componente modular com estado interno para expansão/colapso
 * @param {Object} group - Grupo de transações do dia
 */
export default function ExtratoDayGroup({ group }) {
  const { label, day_total, transactions = [] } = group
  const [isExpanded, setIsExpanded] = useState(true)
  const transactionCount = transactions.length

  return (
    <div className="space-y-0.5">
      {/* Day Header - Clickable to collapse/expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-2.5 sticky top-0 z-10 bg-gray-50/95 dark:bg-[#070707]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-100/95 dark:hover:bg-gray-800/50 transition-colors group"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} transações de ${label}`}
      >
        <div className="flex items-center gap-2">
          {/* Collapse icon */}
          <motion.svg
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-3 w-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>

          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </span>

          <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[9px] font-semibold text-gray-600 dark:text-gray-400">
            {transactionCount}
          </span>
        </div>

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Total: <strong className="text-gray-700 dark:text-gray-300">{formatCurrencyBRL(day_total)}</strong>
        </span>
      </button>

      {/* Transactions List with animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <ExtratoTransactionRow transaction={tx} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
