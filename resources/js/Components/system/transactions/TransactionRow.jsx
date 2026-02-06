import React from "react";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import DangerButton from "@/Components/common/buttons/DangerButton";
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
    status,
    created_at,
    bank_name,
    category_name,
    category_icon,
    category_color,
    total_installments,
    anexos_count,
  } = transaction;

  const totalInstallmentsNumber = Math.max(Number(total_installments || 1), 1);
  const installmentsLabel =
    totalInstallmentsNumber > 1 ? `${totalInstallmentsNumber}x` : null;

  const handleRowClick = () => {
    if (onShowDetails) onShowDetails(transaction);
  };

  const stopAnd = (fn) => (event) => {
    event.stopPropagation();
    if (fn) fn(transaction);
  };

  return (
    <div
      className="flex flex-col gap-2 rounded-lg px-3 lg:px-3 py-1.5 lg:py-2 hover:bg-gray-50 dark:hover:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm lg:text-base font-medium text-gray-900 dark:text-gray-100">
            {title}
          </p>
          {status && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {status === "overdue" ? "Vencida" : status === "unpaid" ? "Em aberto" : status}
            </span>
          )}
          {anexos_count > 0 && (
            <Tooltip label={`${anexos_count} anexo${anexos_count > 1 ? 's' : ''}`}>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PaperclipIcon className="w-3 h-3" />
                {anexos_count}
              </span>
            </Tooltip>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] lg:text-xs text-gray-500 dark:text-gray-400">
          {bank_name && (
            <span>
              {bank_name}
              {installmentsLabel && ` • ${installmentsLabel}`}
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
          {description && <span className="truncate max-w-xs">• {description}</span>}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 sm:mt-0 sm:gap-4">
        <div className="flex flex-col items-end text-right">
					<span className="text-sm lg:text-base font-semibold themed-amount">
            -{formatCurrency(amount)}
          </span>
					<span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {formatDate(created_at)}
          </span>
        </div>
				<div className="flex flex-col items-end gap-1 text-[11px] sm:text-xs">
          <Tooltip label="Editar transação">
            <SecondaryButton
              type="button"
					onClick={stopAnd(onEdit)}
						className="rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide"
            >
              <EditIcon type={1} size={20} />
            </SecondaryButton>
          </Tooltip>
          <Tooltip label="Remover transação">
            <DangerButton
              type="button"
					onClick={stopAnd(onDelete)}
						className="rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide"
            >
              <RemoveIcon type={1} size={20} />
            </DangerButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
