import React from "react";
import Tooltip from "@/Components/common/Tooltip";
import RemoveIcon from "@/Components/common/icons/RemoveIcon";
import EditIcon from "@/Components/common/icons/EditIcon";
import { PaperclipIcon } from "@/Components/common/icons/FileIcons";
import CategoryBadge from "@/Components/common/CategoryBadge";
import { formatCurrency, formatDate } from "@/Lib/formatters";

export default function TransactionRow({ transaction, onEdit, onDelete, onShowDetails }) {
  const {
    title,
    description,
    amount,
    type,
    status,
    created_at,
    bank_name,
    category_name,
    category_icon,
    category_color,
    total_installments,
    is_recurring,
    anexos_count,
  } = transaction;

  const totalInstallmentsNumber = Math.max(Number(total_installments || 1), 1);
  const installmentsLabel =
    totalInstallmentsNumber > 1 ? `${totalInstallmentsNumber}x` : null;

  const isCredit = type === "credit";

  const handleRowClick = () => {
    if (onShowDetails) onShowDetails(transaction);
  };

  const stopAnd = (fn) => (event) => {
    event.stopPropagation();
    if (fn) fn(transaction);
  };

  const statusConfig = {
    overdue: { label: "Vencida", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    unpaid: { label: "Em aberto", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    paid: { label: "Paga", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };
  const statusInfo = statusConfig[status] || (status ? { label: status, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" } : null);

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      role={onShowDetails ? "button" : undefined}
      tabIndex={onShowDetails ? 0 : undefined}
    >
      {/* Type indicator */}
      <div className="hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </p>
          {statusInfo && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          )}
          {is_recurring && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Recorrente
            </span>
          )}
          {anexos_count > 0 && (
            <Tooltip label={`${anexos_count} anexo${anexos_count > 1 ? 's' : ''}`}>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PaperclipIcon className="w-3 h-3" />
                {anexos_count}
              </span>
            </Tooltip>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
          {bank_name && (
            <span>
              {bank_name}
              {installmentsLabel && ` · ${installmentsLabel}`}
            </span>
          )}
          {category_name && (
            <CategoryBadge
              name={category_name}
              icon={category_icon}
              color={category_color}
              size="sm"
            />
          )}
          {description && <span className="truncate max-w-[200px]">· {description}</span>}
        </div>
      </div>

      {/* Amount + Date */}
      <div className="flex flex-col items-end text-right flex-shrink-0">
        <span className="text-sm font-semibold tabular-nums themed-amount">
          -{formatCurrency(amount)}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
          {formatDate(created_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip label="Editar">
          <button
            type="button"
            onClick={stopAnd(onEdit)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/10 transition-colors"
          >
            <EditIcon type={1} size={16} />
          </button>
        </Tooltip>
        <Tooltip label="Remover">
          <button
            type="button"
            onClick={stopAnd(onDelete)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <RemoveIcon type={1} size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
