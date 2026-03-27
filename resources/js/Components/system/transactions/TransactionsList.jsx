import React from "react";
import ScrollArea from "@/Components/common/ScrollArea";
import TransactionRow from "@/Components/system/transactions/TransactionRow";

export default function TransactionsList({ transactions = [], onEdit, onDelete, onShowDetails }) {
  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
          <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Nenhuma transação encontrada
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Tente ajustar os filtros ou selecionar outro período.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea
      maxHeightClassName="max-h-[460px] md:max-h-[540px] lg:max-h-[600px]"
      className="divide-y divide-gray-100 dark:divide-white/[0.04]"
    >
      {transactions.map((tx) => (
        <TransactionRow
          key={tx.id}
          transaction={tx}
          onEdit={onEdit}
          onDelete={onDelete}
          onShowDetails={onShowDetails}
        />
      ))}
    </ScrollArea>
  );
}
