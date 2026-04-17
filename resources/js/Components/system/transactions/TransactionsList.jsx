import React, { useMemo } from "react";
import { Receipt } from "lucide-react";
import TransactionRow from "@/Components/system/transactions/TransactionRow";
import { formatCurrencyBRL } from "@/Lib/formatters";

/* ─── Group transactions by calendar date ─────────────────────── */
function groupByDate(transactions) {
  const groups = new Map();
  for (const tx of transactions) {
    const raw = tx.created_at ?? tx.date ?? "";
    const dateKey = raw ? raw.slice(0, 10) : "—";
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(tx);
  }
  return [...groups.entries()]; // [dateKey, tx[]]
}

function formatGroupLabel(dateKey) {
  if (!dateKey || dateKey === "—") return "Sem data";
  try {
    const [y, m, d] = dateKey.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  } catch {
    return dateKey;
  }
}

export default function TransactionsList({ transactions = [], onEdit, onDelete, onShowDetails }) {
  const groups = useMemo(() => groupByDate(transactions), [transactions]);

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
          <Receipt className="h-7 w-7 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          Nenhuma transação encontrada
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Tente ajustar os filtros ou selecionar outro período.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([dateKey, txList]) => {
        const dayTotal = txList.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        const debitTotal = txList
          .filter((tx) => tx.type !== "credit")
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        return (
          <div key={dateKey}>
            {/* Date group header */}
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-semibold capitalize text-gray-500 dark:text-gray-400">
                {formatGroupLabel(dateKey)}
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-red-500 dark:text-red-400">
                -{formatCurrencyBRL(debitTotal)}
              </span>
            </div>
            {/* Transactions */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800/60 divide-y divide-gray-100 dark:divide-gray-800/40 overflow-hidden">
              {txList.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onShowDetails={onShowDetails}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
