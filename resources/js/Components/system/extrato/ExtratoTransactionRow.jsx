import React from 'react'
import CategoryBadge from '@/Components/common/CategoryBadge'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function ExtratoTransactionRow({ transaction, onSelect }) {
  const {
    title,
    description,
    type,
    status,
    amount,
    installment_amount,
    total_installments,
    current_installment,
    is_recurring,
    bank_name,
    category_name,
    category_icon,
    category_color,
    created_at,
  } = transaction || {}

  const displayValue = type === 'credit' ? installment_amount ?? amount : amount
  const isDebit = type === 'debit'

  const statusConfig = {
    paid: {
      label: 'Pago',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    overdue: {
      label: 'Vencido',
      className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    },
    unpaid: {
      label: 'Em aberto',
      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    },
  }

  const statusInfo = statusConfig[status] || statusConfig.unpaid

  const installmentLabel =
    total_installments && total_installments > 1
      ? `${current_installment || 1}/${total_installments}`
      : null

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${onSelect ? 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-900/30 active:bg-gray-100 dark:active:bg-gray-800/50' : 'hover:bg-gray-50/80 dark:hover:bg-gray-900/30'}`}
      onClick={() => onSelect?.(transaction)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(transaction); } }}
    >
      <div
        className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      >
        ↓
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {title}
          </span>
          {installmentLabel && (
            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {installmentLabel}
            </span>
          )}
          {is_recurring && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Recorrente
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {category_name && (
            <CategoryBadge name={category_name} icon={category_icon} color={category_color} size="sm" />
          )}
          {bank_name && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{bank_name}</span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(created_at)}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className='text-sm font-semibold text-red-500 dark:text-red-400'
        >
          - {formatCurrency(displayValue)}
        </span>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>
    </div>
  )
}
