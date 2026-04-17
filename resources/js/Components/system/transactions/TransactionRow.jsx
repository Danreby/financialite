import React from "react";
import { CreditCard, ArrowDownLeft, RefreshCw, Paperclip } from "lucide-react";
import Tooltip from "@/Components/common/Tooltip";
import RemoveIcon from "@/Components/common/icons/RemoveIcon";
import EditIcon from "@/Components/common/icons/EditIcon";
import { getIconEmoji } from "@/Utils/categoryIcons";
import { formatCurrency, formatDate } from "@/Lib/formatters";

/* ─── Status badge ───────────────────────────────────────────── */
const STATUS_CONFIG = {
  overdue: { label: "Vencida", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  unpaid:  { label: "Pendente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  paid:    { label: "Paga",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ─── Category dot ───────────────────────────────────────────── */
function CategoryDot({ icon, name, color }) {
  const emoji = icon ? (getIconEmoji(icon) || icon) : null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
      {emoji ? (
        <span className="text-sm leading-none">{emoji}</span>
      ) : (
        <span
          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color || "#9ca3af" }}
        />
      )}
      {name}
    </span>
  );
}

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
    current_installment,
    is_recurring,
    anexos_count,
  } = transaction;

  const isCredit = type === "credit";
  const installments = Math.max(Number(total_installments || 1), 1);
  const currentInst = Number(current_installment || 0);
  const showInstallments = installments > 1;
  const installmentDisplay = showInstallments ? `${currentInst}/${installments}` : null;

  const handleRowClick = () => onShowDetails?.(transaction);
  const stopAnd = (fn) => (e) => { e.stopPropagation(); fn?.(transaction); };

  return (
    <div
      className="group relative flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
      onClick={handleRowClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleRowClick(); } }}
      role={onShowDetails ? "button" : undefined}
      tabIndex={onShowDetails ? 0 : undefined}
    >
      {/* ── Type icon ── */}
      <div
        className={`hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
          isCredit
            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {isCredit ? <CreditCard className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>

      {/* ── Mobile type accent bar ── */}
      <div
        className={`sm:hidden absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
          isCredit ? "bg-purple-400" : "bg-red-400"
        }`}
      />

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-none">
            {title}
          </p>
          <StatusBadge status={status} />
          {is_recurring && (
            <Tooltip label="Recorrente">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                <RefreshCw className="h-2.5 w-2.5" />
                <span className="hidden xs:inline">Recorrente</span>
              </span>
            </Tooltip>
          )}
          {anexos_count > 0 && (
            <Tooltip label={`${anexos_count} anexo${anexos_count > 1 ? "s" : ""}`}>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Paperclip className="h-2.5 w-2.5" />
                {anexos_count}
              </span>
            </Tooltip>
          )}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {category_name && (
            <CategoryDot icon={category_icon} name={category_name} color={category_color} />
          )}
          {bank_name && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {bank_name}
              {installmentDisplay && (
                <span className="ml-1 rounded bg-purple-100 dark:bg-purple-900/30 px-1 py-px text-[9px] font-semibold text-purple-700 dark:text-purple-300">
                  {installmentDisplay}
                </span>
              )}
            </span>
          )}
          {description && (
            <span className="hidden sm:inline text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* ── Amount & Date ── */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-1">
        <span
          className={`text-sm font-bold tabular-nums ${
            isCredit
              ? "text-purple-600 dark:text-purple-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isCredit ? "" : "-"}{formatCurrency(amount)}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
          {formatDate(created_at)}
        </span>
      </div>

      {/* ── Action buttons (hover) ── */}
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
