import React from "react";
import Modal from "@/Components/common/Modal";
import AnexoSection from "@/Components/system/anexo/AnexoSection";
import { formatCurrency } from "@/Lib/formatters";

function formatFullDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function FaturaDetailModal({ isOpen, onClose, item }) {
  if (!item) {
    return null;
  }

  const {
    id,
    transacao_id,
    title,
    description,
    amount,
    type,
    status,
    created_at,
    paid_date,
    total_installments,
    current_installment,
    display_installment,
    is_recurring,
    bank_name,
    category_name,
  } = item;

  const realTransacaoId = transacao_id || id;

  const totalInstallmentsNumber = Math.max(Number(total_installments || 1), 1);
  const rawAmountNumber = Number(amount || 0) || 0;
  const installmentAmount =
    totalInstallmentsNumber > 1 ? rawAmountNumber / totalInstallmentsNumber : rawAmountNumber;

  const hasInstallments = totalInstallmentsNumber > 1;

  const statusLabel =
    status === "paid"
      ? "Pago ✔️"
      : status === "overdue"
      ? "Vencido ❌"
      : "Em aberto ⌛";

  const typeLabel = type === "credit" ? "Crédito" : type === "debit" ? "Débito" : "-";

  const effectiveInstallmentNumber =
    total_installments && total_installments > 1
      ? display_installment || current_installment || 1
      : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Detalhes da transação">
      <div className="space-y-2 sm:space-y-3 md:space-y-4 text-base sm:text-lg text-gray-800 dark:text-gray-200">
        <div>
          <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Título
          </p>
          <p className="mt-0.5 sm:mt-1 text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-400">{description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Valor total
            </p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(rawAmountNumber)}
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Valor do mês
            </p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-rose-600 dark:text-rose-400">
              {formatCurrency(installmentAmount)}
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Tipo
            </p>
            <p className="text-xs sm:text-sm md:text-base">{typeLabel}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Status
            </p>
            <p className="text-xs sm:text-sm md:text-base">{statusLabel}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Banco
            </p>
            <p className="text-xs sm:text-sm md:text-base truncate">{bank_name || "-"}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Categoria
            </p>
            <p className="text-xs sm:text-sm md:text-base truncate">{category_name || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Data da compra
            </p>
            <p className="text-xs sm:text-sm md:text-base">{formatFullDate(created_at)}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Data de pagamento
            </p>
            <p className="text-xs sm:text-sm md:text-base">{formatFullDate(paid_date)}</p>
          </div>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Parcelamento / recorrência
          </p>
          {is_recurring ? (
            <p className="text-xs sm:text-sm md:text-base">Transação recorrente.</p>
          ) : hasInstallments ? (
            <>
              <p className="text-xs sm:text-sm md:text-base">
                {`Valor por parcela: ${formatCurrency(installmentAmount)}`}
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                {effectiveInstallmentNumber && (
                  <span className="mr-3">
                    Parcelas: <span className="font-semibold">{effectiveInstallmentNumber}/{totalInstallmentsNumber}</span>
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-xs sm:text-sm md:text-base">Transação única.</p>
          )}
        </div>

        {realTransacaoId && (
          <div className="pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
            <AnexoSection transacaoId={realTransacaoId} />
          </div>
        )}
      </div>
    </Modal>
  );
}
