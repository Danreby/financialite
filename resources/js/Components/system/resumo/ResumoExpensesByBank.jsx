import React, { useState } from 'react'
import { Landmark, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import ScrollArea from '@/Components/common/ScrollArea'
import CategoryBadge from '@/Components/common/CategoryBadge'

export default function ResumoExpensesByBank({ banks = [] }) {
  const [expandedBank, setExpandedBank] = useState(null)

  const toggleBank = (bankUserId) => {
    setExpandedBank(prev => prev === bankUserId ? null : bankUserId)
  }

  const totalAll = banks.reduce((acc, b) => acc + (b.total || 0), 0)

  return (
    <div className="themed-card rounded-2xl p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          Despesas por Banco (Débito)
        </h2>
        <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
          {formatCurrencyBRL(totalAll)}
        </span>
      </div>

      {banks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma despesa no débito</p>
        </div>
      ) : (
        <ScrollArea maxHeightClassName="max-h-[400px]" className="flex-1 space-y-3 pr-1">
          {banks.map(bank => {
            const isExpanded = expandedBank === bank.bank_user_id
            const key = bank.bank_user_id ?? 'no-bank'

            return (
              <div
                key={key}
                className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleBank(bank.bank_user_id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {bank.bank_name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {bank.count} transação{bank.count !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrencyBRL(bank.total)}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 space-y-1.5 bg-gray-50/50 dark:bg-gray-900/20">
                    {bank.transactions.map((t, idx) => (
                      <div
                        key={t.id ?? idx}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {t.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {t.category_name && (
                                <CategoryBadge
                                  name={t.category_name}
                                  icon={t.category_icon}
                                  color={t.category_color}
                                  size="sm"
                                />
                              )}
                              {t.date && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.date}</span>
                              )}
                              {t.is_recurring && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                                  Recorrente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">
                          {formatCurrencyBRL(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </ScrollArea>
      )}
    </div>
  )
}
