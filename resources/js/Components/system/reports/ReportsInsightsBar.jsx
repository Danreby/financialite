import React from "react";
import { formatCurrencyBRL } from "@/Lib/formatters";

export default function ReportsInsightsBar({ insights }) {
  const items = [
    {
      label: "Saldo líquido (pagos)",
      value: formatCurrencyBRL(insights.netBalance || 0),
      helper: "Receitas pagas − despesas pagas",
      icon: "💰",
      tone: (insights.netBalance || 0) >= 0 ? "positive" : "negative",
    },
    {
      label: "Ticket médio",
      value: insights.averageTicket ? formatCurrencyBRL(insights.averageTicket) : "-",
      helper: "Valor médio por transação no período",
      icon: "🎫",
    },
    {
      label: "Mês de maior gasto",
      value: insights.topExpenseLabel || "-",
      helper: insights.topExpenseValue ? formatCurrencyBRL(insights.topExpenseValue) : "Sem histórico",
      icon: "📊",
    },
    {
      label: "Taxa de poupança",
      value: insights.savingsRate != null ? `${insights.savingsRate.toFixed(1)}%` : "-",
      helper: "Renda mensal − gasto médio / renda",
      icon: "🏦",
      tone: insights.savingsRate > 20 ? "positive" : insights.savingsRate > 0 ? "neutral" : "negative",
    },
    {
      label: "Média mensal",
      value: insights.monthlyAvg ? formatCurrencyBRL(insights.monthlyAvg) : "-",
      helper: "Gasto médio por mês no período",
      icon: "📅",
    },
    {
      label: "Total de transações",
      value: insights.totalTransactions != null ? String(insights.totalTransactions) : "-",
      helper: "Quantidade total no período filtrado",
      icon: "🔢",
    },
  ];

  return (
    <div className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4 h-full">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Insights rápidos</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const toneClass = item.tone === "positive"
            ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10"
            : item.tone === "negative"
              ? "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10"
              : "border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/60";

          return (
            <div
              key={item.label}
              className={`rounded-xl border px-3 py-2 shadow-sm ${toneClass}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{item.icon}</span>
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  {item.label}
                </p>
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{item.helper}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
