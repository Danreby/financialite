import React, { useMemo, useState } from 'react'
import { Loader2, Receipt, FileText, BarChart3, Calculator } from 'lucide-react'
import { formatCurrencyBRL } from '@/Lib/formatters'
import { getIconEmoji } from '@/Utils/categoryIcons'
import ScrollArea from '@/Components/common/ScrollArea'

function InvoiceToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? '' : 'bg-gray-300 dark:bg-gray-700'
        }`}
        style={checked ? { backgroundColor: 'var(--theme-accent)' } : undefined}
      >
        <span
          className={`absolute inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </label>
  )
}

export default function ResumoPrevisaoTab({ data, isLoading }) {
  const [usePendingInvoice, setUsePendingInvoice] = useState(false)
  const [includeDebitAverage, setIncludeDebitAverage] = useState(false)

  const invoice = data?.invoice
  const bills = data?.bills
  const debitAverages = data?.debit_category_averages

  const invoiceTotal = useMemo(() => {
    if (!invoice) return 0
    return usePendingInvoice ? invoice.pending.total : invoice.projected.total
  }, [invoice, usePendingInvoice])

  const grandTotal = useMemo(() => {
    const billsTotal = bills?.total ?? 0
    const debitTotal = includeDebitAverage ? (debitAverages?.total ?? 0) : 0
    return invoiceTotal + billsTotal + debitTotal
  }, [invoiceTotal, bills, debitAverages, includeDebitAverage])

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-accent)]" />
      </div>
    )
  }

  const pendingIsDifferentMonth = usePendingInvoice
    && invoice.pending.month_key
    && invoice.pending.month_key !== data.month_key

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="themed-card rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'color-mix(in srgb, var(--theme-accent) 6%, transparent)' }}
        />
        <div className="relative flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            <Calculator className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
            Total Previsto para {data.month_label}
          </div>
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: 'var(--theme-accent)' }}>
            {formatCurrencyBRL(grandTotal)}
          </span>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
            {usePendingInvoice ? 'Fatura pendente atual' : 'Fatura do mês'} + Contas
            {includeDebitAverage ? ' + Média de débito' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className="themed-card rounded-2xl p-4 sm:p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Fatura do Mês
            </h2>
            <InvoiceToggle
              checked={usePendingInvoice}
              onChange={setUsePendingInvoice}
              label="Usar fatura atual pendente"
            />
          </div>

          <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrencyBRL(invoiceTotal)}
          </span>

          {pendingIsDifferentMonth && (
            <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1">
              Referente a {invoice.pending.month_label}
            </p>
          )}

          {usePendingInvoice && !invoice.pending.has_pending && (
            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
              Nenhuma fatura pendente no momento.
            </p>
          )}

          {invoice.projected.cards.length > 0 && (
            <div className="mt-4 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Detalhe por cartão (fatura projetada)
              </p>
              <ScrollArea maxHeightClassName="max-h-[220px]" className="space-y-1.5 pr-1">
                {invoice.projected.cards.map((card) => (
                  <div
                    key={card.bank_user_id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                      {card.card_name}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2 flex-shrink-0">
                      {formatCurrencyBRL(card.total)}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="themed-card rounded-2xl p-4 sm:p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              Valor das Contas
            </h2>
            <span className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400">
              {formatCurrencyBRL(bills.total)}
            </span>
          </div>

          {bills.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma conta prevista para este mês</p>
            </div>
          ) : (
            <ScrollArea maxHeightClassName="max-h-[300px]" className="flex-1 space-y-1.5 pr-1">
              {bills.items.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {bill.category_icon && (
                      <span className="text-sm">{getIconEmoji(bill.category_icon) || bill.category_icon}</span>
                    )}
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                      {bill.title}
                    </span>
                    {bill.is_estimated && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium flex-shrink-0">
                        Variável (média)
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2 flex-shrink-0">
                    {formatCurrencyBRL(bill.amount)}
                  </span>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </div>

      <div className="themed-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-accent)]" />
            Média de Categorias no Débito (últimos 4 meses)
          </h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDebitAverage}
              onChange={(e) => setIncludeDebitAverage(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-theme-accent focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f]"
            />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Considerar débito no total
            </span>
          </label>
        </div>

        {debitAverages.categories.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-400 dark:text-gray-500">Dados insuficientes para calcular médias</p>
          </div>
        ) : (
          <ScrollArea maxHeightClassName="max-h-[400px]" className="pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {debitAverages.categories.map((item, idx) => (
                <div
                  key={item.category_id ?? idx}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-white dark:bg-[#0b0b0b]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {item.category_icon && (
                      <span className="text-base">{getIconEmoji(item.category_icon) || item.category_icon}</span>
                    )}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.category_color || '#6366f1' }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.category_name}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrencyBRL(item.average)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
