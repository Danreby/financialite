import React from 'react'

export default function ExtratoTransactionsHeader({ count = 0 }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Movimentações
        </h2>
        {count > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400">
            {count}
          </span>
        )}
      </div>
      
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {count === 0
          ? 'Nenhuma transação'
          : `${count} ${count === 1 ? 'transação' : 'transações'}`}
      </span>
    </div>
  )
}
