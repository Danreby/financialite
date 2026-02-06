import React from 'react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const TYPE_CONFIG = {
  montante:  { icon: '💰', label: 'Montante', gradient: 'from-amber-500 to-yellow-600' },
  porquinho: { icon: '🐷', label: 'Porquinho', gradient: 'from-pink-500 to-rose-600' },
}

export default function SavingsCard({ goal, onEdit, onDelete, onDeposit, onWithdraw }) {
  const config = TYPE_CONFIG[goal.type] || TYPE_CONFIG.porquinho
  const progress = goal.progress || 0
  const isCompleted = goal.is_completed

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        isCompleted
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/20'
          : goal.is_active
            ? 'border-gray-200 bg-white shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-[#0b0b0b]'
            : 'border-gray-200/60 bg-gray-50 opacity-60 dark:border-gray-800/60 dark:bg-[#0a0a0a]'
      }`}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        {/* Icon */}
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-xl sm:text-2xl shadow-sm`}>
          {goal.icon || config.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {goal.title}
            </h4>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.15)' : 'var(--theme-accentLight, rgba(244, 63, 94, 0.1))',
                color: isCompleted ? '#16a34a' : 'var(--theme-accent, #f43f5e)',
              }}>
              {isCompleted ? '✅ Concluída' : config.label}
            </span>
          </div>

          {goal.description && (
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {goal.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-500 dark:text-gray-400">
                {formatCurrencyBRL(goal.current_amount)} de {formatCurrencyBRL(goal.target_amount)}
              </span>
              <span className="font-semibold" style={{ color: 'var(--theme-accent, #f43f5e)' }}>
                {progress}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? '#22c55e' : 'var(--theme-accent, #f43f5e)',
                }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Faltam {formatCurrencyBRL(goal.remaining || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-gray-100 px-3 py-1.5 dark:border-gray-800/60 flex-wrap">
        {!isCompleted && (
          <>
            <button
              type="button"
              onClick={() => onDeposit?.(goal)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              + Depositar
            </button>
            {Number(goal.current_amount) > 0 && (
              <button
                type="button"
                onClick={() => onWithdraw?.(goal)}
                className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 transition dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                - Retirar
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => onEdit?.(goal)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(goal)}
          className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 transition dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Remover
        </button>
      </div>
    </div>
  )
}
