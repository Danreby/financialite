import React from "react";
import ScrollArea from "@/Components/common/ScrollArea";
import { formatCurrency } from "@/Lib/formatters";

function TransactionRow({ item }) {
  const totalInstallments = item.total_installments || 1;
  const logicalInstallment =
    totalInstallments > 1
      ? item.display_installment ||
        Math.min((item.current_installment || 0) + 1, totalInstallments)
      : 1;
  const installmentAmount = item.installment_amount ?? (item.amount || 0) / totalInstallments;
  const remainingInstallments = Math.max(
    totalInstallments - (logicalInstallment - 1),
    0
  );

  const label = (() => {
    if (item.is_recurring) return "Recorrente";
    if (totalInstallments > 1)
      return `Parcela ${logicalInstallment}/${totalInstallments}`;
    return "À vista";
  })();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-2.5 py-2.5 text-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-medium leading-snug">
          {item.title}
        </p>
        <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
          {label}
          {totalInstallments > 1 && (
            <span className="ml-1.5 text-gray-400 dark:text-gray-500">
              · {remainingInstallments} restante{remainingInstallments !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold text-xs sm:text-sm themed-amount">
          {formatCurrency(installmentAmount)}
        </p>
      </div>
    </div>
  );
}

export default function FaturaCardTransactionList({ items = [], totalToPay = 0, emptyMessage }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-800 dark:bg-gray-900/20">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage ?? "Nenhuma transação pendente para este cartão neste mês."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#050505]">
      <div className="px-3 pt-3 pb-1 sm:px-4 sm:pt-3.5">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Transações pendentes da fatura
        </p>
      </div>

      <ScrollArea
        maxHeightClassName="max-h-56 sm:max-h-64"
        className="px-2 pb-2 sm:px-3 sm:pb-3 space-y-1.5 mt-1.5"
      >
        {items.map((item) => (
          <TransactionRow key={item.id} item={item} />
        ))}
      </ScrollArea>

      <div className="mx-3 sm:mx-4 mb-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 dark:border-gray-700">
        <span className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
          Total a pagar agora
        </span>
        <span className="text-xs sm:text-sm font-bold themed-amount">
          {formatCurrency(totalToPay)}
        </span>
      </div>
    </div>
  );
}
