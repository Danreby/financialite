import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const TYPE_CONFIG = {
  salary:     { icon: '💼', gradient: 'from-blue-500 to-indigo-600' },
  freelance:  { icon: '💻', gradient: 'from-violet-500 to-purple-600' },
  investment: { icon: '📈', gradient: 'from-emerald-500 to-teal-600' },
  rental:     { icon: '🏠', gradient: 'from-amber-500 to-orange-600' },
  benefit:    { icon: '🎁', gradient: 'from-pink-500 to-rose-600' },
  other:      { icon: '💰', gradient: 'from-gray-500 to-slate-600' },
}

export default function IncomeCard({ income, onEdit, onToggle, onDelete }) {
  const config = TYPE_CONFIG[income.type] || TYPE_CONFIG.other

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        income.is_active
          ? 'border-gray-200 bg-white shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-[#0b0b0b]'
          : 'border-gray-200/60 bg-gray-50 opacity-60 dark:border-gray-800/60 dark:bg-[#0a0a0a]'
      }`}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {/* Ícone */}
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-xl sm:text-2xl shadow-sm`}>
          {config.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {income.title}
            </h4>
            {!income.is_active && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Inativa
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              {income.type_label}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              📅 {income.payment_day_label}
            </span>
            {income.bank_name && (
              <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                🏦 {income.bank_name}
              </span>
            )}
          </div>
          {income.description && (
            <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {income.description}
            </p>
          )}
        </div>

        {/* Valor */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrencyBRL(income.amount)}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-1 border-t border-gray-100 px-3 py-1.5 dark:border-gray-800/60">
        <button
          type="button"
          onClick={() => onToggle?.(income)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {income.is_active ? 'Desativar' : 'Ativar'}
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(income)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(income)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Remover
        </button>
      </div>
    </div>
  )
}
