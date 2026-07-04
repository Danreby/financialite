import React, { useMemo, useState } from "react";
import FaturaItemRow from "@/Components/system/fatura/FaturaItemRow";
import FaturaPayModal from "@/Components/system/fatura/FaturaPayModal";
import FaturaPaymentSummaryCard from "@/Components/system/fatura/FaturaPaymentSummaryCard";
import FaturaDetailModal from "@/Components/system/fatura/FaturaDetailModal";
import ScrollArea from "@/Components/common/ScrollArea";
import BareButton from "@/Components/common/buttons/BareButton";
import Tooltip from "@/Components/common/Tooltip";
import { formatCurrency } from "@/Lib/formatters";

function BillsReportCard({ billsData, totalSpent }) {
  const { total = 0, items = [] } = billsData || {};
  if (!items.length) return null;

  const combinedTotal = totalSpent + total;

  return (
    <div className="rounded-2xl themed-card bg-white dark:bg-[#080808] overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.05]">
        <div
          className="h-5 w-5 rounded-md flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: 'rgba(251,146,60,0.15)' }}
        >
          📋
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
          Contas a pagar
        </h3>
        <span
          className="ml-auto text-[11px] font-semibold rounded-full px-2 py-0.5"
          style={{ backgroundColor: 'rgba(251,146,60,0.12)', color: 'rgba(251,146,60,0.9)' }}
        >
          {items.length} {items.length === 1 ? 'conta' : 'contas'}
        </span>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-white/[0.04] px-4 sm:px-5">
        {items.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between py-2.5">
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate mr-3">
              {bill.title}
              {bill.recurrence_type === 'yearly' && (
                <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-600">(anual)</span>
              )}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {bill.is_variable && (
                <span className="text-[10px] text-gray-400 dark:text-gray-600 italic">
                  {bill.avg_count > 0 ? `média ${bill.avg_count}m` : 'sem histórico'}
                </span>
              )}
              {bill.amount > 0 ? (
                <span
                  className="text-xs font-semibold"
                  style={bill.is_variable ? { color: 'rgba(251,146,60,0.85)' } : {}}
                >
                  {formatCurrency(bill.amount)}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 sm:px-5 pt-3 pb-4 space-y-1.5 bg-gray-50/60 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.05]">
        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>Total de contas</span>
          <span className="font-semibold" style={{ color: 'rgba(251,146,60,0.9)' }}>
            {formatCurrency(total)}
          </span>
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>Fatura do cartão</span>
          <span className="font-semibold">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-100 pt-1.5 border-t border-gray-200 dark:border-white/[0.08]">
          <span>Total combinado</span>
          <span>{formatCurrency(combinedTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function FaturaMonthSection({
  month_label,
  total_spent,
  total_pending,
  total_paid = 0,
  items = [],
  month_key,
  bankUserId = null,
  bankAccounts = [],
  debitAccounts = [],
  categories = [],
  onPaid,
  onUpdated,
  is_paid = false,
  is_partially_paid = false,
  has_remaining_post_payment = false,
  due_day = null,
  closing_day = null,
  isCurrentPending = false,
  bills_data = null,
}) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalInitialMode, setPayModalInitialMode] = useState("full");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedItem, setSelectedItem] = useState(null);

  const sortedItems = useMemo(() => {
    const cloned = [...items];

    cloned.sort((a, b) => {
      if (sortField === "date") {
        const da = a.created_at ? new Date(a.created_at) : null;
        const db = b.created_at ? new Date(b.created_at) : null;
        const va = da && !Number.isNaN(da.getTime()) ? da.getTime() : 0;
        const vb = db && !Number.isNaN(db.getTime()) ? db.getTime() : 0;
        return sortDirection === "asc" ? va - vb : vb - va;
      }

      if (sortField === "amount") {
        const va = Number(a.amount) || 0;
        const vb = Number(b.amount) || 0;
        return sortDirection === "asc" ? va - vb : vb - va;
      }

      return 0;
    });

    return cloned;
  }, [items, sortField, sortDirection]);

  return (
	<section className="space-y-3 sm:space-y-4 lg:space-y-5 2xl:space-y-5">
      {(closing_day || due_day || total_spent > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
          {closing_day && (
            <span>
              Fechamento: todo dia <span className="font-semibold">{closing_day}</span>
            </span>
          )}
          {due_day && (
            <span>
              Vencimento: todo dia <span className="font-semibold">{due_day}</span>
            </span>
          )}
          {total_spent > 0 && (
            <span>
              Total de despesas:{" "}
              <span className="font-semibold themed-amount">{formatCurrency(total_spent)}</span>
            </span>
          )}
        </div>
      )}

      <FaturaPaymentSummaryCard
        monthLabel={month_label}
        totalSpent={total_spent}
        totalPending={total_pending ?? total_spent}
        totalPaid={total_paid}
        isPaid={is_paid}
        isPartiallyPaid={is_partially_paid}
        hasRemainingPostPayment={has_remaining_post_payment}
        isCurrentPending={isCurrentPending}
        onPayFull={() => {
          setPayModalInitialMode("full");
          setShowPayModal(true);
        }}
        onPayPartial={() => {
          setPayModalInitialMode("partial");
          setShowPayModal(true);
        }}
      />

      <BillsReportCard billsData={bills_data} totalSpent={total_spent} />

      <div className="rounded-2xl bg-white themed-card px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-3 2xl:px-4 2xl:py-3 shadow-gray-500 dark:shadow-gray-900 dark:bg-[#080808]">
        {items.length === 0 ? (
					<p className="px-3 py-2 text-xs sm:text-sm lg:text-base 2xl:text-sm text-gray-500 dark:text-gray-400">
            Nenhuma transação neste mês.
          </p>
        ) : (
          <>
						<div className="flex items-center justify-between px-3 pt-3 pb-2 text-[11px] sm:text-xs lg:text-sm 2xl:text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold uppercase tracking-wide">Ordenar</span>
              <div className="flex items-center gap-2">
                <BareButton
                  type="button"
                  onClick={() => setSortField("date")}
								className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] sm:text-[11px] 2xl:text-[11px] font-medium transition ${
                    sortField === "date"
                      ? "themed-sort-active"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#050505] dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  Data
                </BareButton>
                <BareButton
                  type="button"
                  onClick={() => setSortField("amount")}
								className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] sm:text-[11px] 2xl:text-[11px] font-medium transition ${
                    sortField === "amount"
                      ? "themed-sort-active"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#050505] dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  Valor
                </BareButton>
                <Tooltip
                  label={
                    sortDirection === "desc"
                      ? "Do mais recente/mais caro para o mais antigo/mais barato"
                      : "Do mais antigo/mais barato para o mais recente/mais caro"
                  }
                >
                    <BareButton
                    type="button"
                    onClick={() =>
                      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
                    }
								className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-1.5 text-[10px] sm:text-[11px] 2xl:text-[11px] font-medium text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-[#050505] dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {sortDirection === "desc" ? "▼" : "▲"}
                  </BareButton>
                </Tooltip>
              </div>
            </div>
						<ScrollArea
							maxHeightClassName="max-h-[360px] md:max-h-[420px] lg:max-h-[460px] 2xl:max-h-[400px]"
							className="divide-y divide-gray-100 dark:divide-gray-800"
						>
              {sortedItems.map((item) => (
                <FaturaItemRow
                  key={item.id}
                  {...item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </ScrollArea>
          </>
        )}
      </div>

      <FaturaPayModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        monthKey={month_key}
        monthLabel={month_label}
        items={items}
        totalSpent={total_spent}
        totalPaid={total_paid}
        bankUserId={bankUserId}
        bankAccounts={bankAccounts}
        debitAccounts={debitAccounts}
        onPaid={onPaid}
        initialMode={payModalInitialMode}
      />
      <FaturaDetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        bankAccounts={bankAccounts}
        categories={categories}
        onUpdated={onUpdated}
      />
    </section>
  );
}
