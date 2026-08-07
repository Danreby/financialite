import React from 'react'
import { Wallet, CreditCard, Receipt, Banknote } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'

const SEGMENTS = [
  {
    key: 'invoice',
    label: 'Fatura pendente',
    icon: CreditCard,
    swatchClass: 'bg-[#2a78d6] dark:bg-[#3987e5]',
  },
  {
    key: 'bills',
    label: 'Contas do mês',
    icon: Receipt,
    swatchClass: 'bg-[#eb6834] dark:bg-[#d95926]',
  },
  {
    key: 'debit',
    label: 'Débito do mês',
    icon: Banknote,
    swatchClass: 'bg-[#1baf7a] dark:bg-[#199e70]',
  },
]

export default function MonthlyForecastCard({
  monthLabel = 'Mês atual',
  invoiceTotal = 0,
  billsTotal = 0,
  debitTotal = 0,
}) {
  const values = { invoice: invoiceTotal, bills: billsTotal, debit: debitTotal }
  const total = invoiceTotal + billsTotal + debitTotal

  const segments = SEGMENTS
    .map((seg) => ({
      ...seg,
      value: values[seg.key],
      pct: total > 0 ? (values[seg.key] / total) * 100 : 0,
    }))
    .filter((seg) => seg.value > 0)

  return (
    <div className="themed-card rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
            <Wallet className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Previsão do mês
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">{monthLabel}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg lg:text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {formatCurrencyBRL(total)}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            fatura + contas + débito
          </p>
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="flex h-3 w-full gap-[2px] mb-3">
            {segments.map((seg, i) => (
              <div
                key={seg.key}
                title={`${seg.label}: ${formatCurrencyBRL(seg.value)} (${seg.pct.toFixed(0)}%)`}
                className={`h-full ${seg.swatchClass} ${
                  i === 0 ? 'rounded-l-full' : ''
                } ${i === segments.length - 1 ? 'rounded-r-full' : ''}`}
                style={{ width: `${seg.pct}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SEGMENTS.map((seg) => {
              const value = values[seg.key]
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              const Icon = seg.icon

              return (
                <div key={seg.key} className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block w-2 h-2 rounded-sm shrink-0 ${seg.swatchClass}`} />
                  <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{seg.label}</p>
                    <p className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatCurrencyBRL(value)}
                      <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">{pct}%</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Nenhuma fatura, conta ou transação no débito prevista para este mês.
        </p>
      )}
    </div>
  )
}
