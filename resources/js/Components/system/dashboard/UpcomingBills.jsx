import React from 'react'
import { Calendar, Clock, DollarSign, AlertTriangle, Plus, Edit3, Power, CheckCircle } from 'lucide-react'
import ScrollArea from '@/Components/common/ScrollArea'

export default function UpcomingBills({
  bills = [],
  onPayClick = null,
  onEditClick = null,
  onAddClick = null,
  onToggleClick = null,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date)
  }

  const getDaysUntil = (dateString) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const billDate = new Date(dateString + 'T00:00:00')
    billDate.setHours(0, 0, 0, 0)
    const diffTime = billDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusInfo = (bill) => {
    if (bill.status === 'paid') {
      return {
        label: 'Pago',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: CheckCircle,
      }
    }

    if (bill.status === 'overdue' || bill.is_overdue) {
      const daysUntil = getDaysUntil(bill.date || bill.due_date)
      return {
        label: `Atrasado ${Math.abs(daysUntil)}d`,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: AlertTriangle,
      }
    }

    const daysUntil = getDaysUntil(bill.date || bill.due_date)

    if (daysUntil === 0) {
      return {
        label: 'Vence hoje',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: Clock,
      }
    }

    if (daysUntil <= 3) {
      return {
        label: `${daysUntil}d`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        icon: Clock,
      }
    }

    return {
      label: `${daysUntil}d`,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      icon: Clock,
    }
  }

  const unpaidBills = bills.filter((b) => b.status !== 'paid')
  const totalUpcoming = unpaidBills
    .filter((b) => !b.is_overdue && b.status !== 'overdue')
    .reduce((sum, b) => sum + (b.amount || 0), 0)

  const overdueCount = unpaidBills.filter(
    (b) => b.status === 'overdue' || b.is_overdue
  ).length

  return (
    <div className="themed-card rounded-xl p-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--theme-accent)]" />
            Próximas Contas
          </h3>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 text-red-500 text-xs font-medium bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
              </div>
            )}
            {typeof onAddClick === 'function' && (
              <button
                onClick={onAddClick}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                title="Adicionar conta"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {totalUpcoming > 0 && (
          <div className="bg-[var(--theme-accentLight)] dark:bg-[var(--theme-accent)]/20 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              A pagar nos próximos dias
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalUpcoming)}
            </div>
          </div>
        )}
      </div>

      {bills.length > 0 ? (
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3">
            {bills.map((bill) => {
              const statusInfo = getStatusInfo(bill)
              const StatusIcon = statusInfo.icon
              const billDate = bill.date || bill.due_date

              return (
                <div
                  key={`${bill.id}-${billDate}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {bill.title || bill.description || 'Conta sem nome'}
                      </h4>
                      {(bill.category || bill.category_name) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {bill.category_name || bill.category}
                        </p>
                      )}
                    </div>
                    <div
                      className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1 whitespace-nowrap`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(billDate)}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {bill.amount > 0 ? formatCurrency(bill.amount) : 'A definir'}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {bill.can_pay && typeof onPayClick === 'function' && (
                      <button
                        onClick={() => onPayClick(bill)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                        title="Pagar conta"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pagar
                      </button>
                    )}
                    {typeof onEditClick === 'function' && (
                      <button
                        onClick={() => onEditClick(bill)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                        title="Editar conta"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}
                    {typeof onToggleClick === 'function' && (
                      <button
                        onClick={() => onToggleClick(bill)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                        title="Desativar conta"
                      >
                        <Power className="w-3.5 h-3.5" />
                        Desativar
                      </button>
                    )}
                  </div>

                  {bill.recurring && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      Recorrente
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Nenhuma conta próxima
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Suas contas aparecerão aqui quando se aproximarem do vencimento
          </p>
        </div>
      )}
    </div>
  )
}
