import React, { useMemo, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import ScrollArea from "@/Components/common/ScrollArea";
import Autocomplete from "@/Components/common/inputs/Autocomplete";
import { formatCurrency } from "@/Lib/formatters";

export default function FaturaPayModal({
  isOpen,
  onClose,
  monthKey,
  monthLabel,
  items = [],
  bankUserId = null,
  bankAccounts = [],
  onPaid,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(bankUserId || "");

  const cardOptions = useMemo(
    () => bankAccounts.map((acc) => ({ value: String(acc.id), label: acc.name })),
    [bankAccounts]
  );

  const handleCardSelect = useCallback((value) => {
    setSelectedCardId(value);
  }, []);

  const pendingItems = useMemo(() => {
    const pending = items.filter((item) => item.status !== "paid");
    if (!selectedCardId) return pending;
    return pending.filter(
      (item) => String(item.bank_user_id) === String(selectedCardId)
    );
  }, [items, selectedCardId]);

  const allPendingCount = useMemo(
    () => items.filter((item) => item.status !== "paid").length,
    [items]
  );

  const totalToPay = useMemo(() => {
    return pendingItems.reduce((sum, item) => {
      const totalInstallments = item.total_installments || 1;
      const installmentAmount = (item.amount || 0) / totalInstallments;
      return sum + installmentAmount;
    }, 0);
  }, [pendingItems]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    toast.dismiss();

    try {
      const payload = {
        month: monthKey,
      };
      if (selectedCardId) {
        payload.bank_user_id = selectedCardId;
      }

      await axios.post(route("transacoes.pay_month"), payload);

      toast.success("Pagamentos do mês registrados com sucesso.");
      setIsSubmitting(false);
      if (onPaid) onPaid();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);

      if (error.response && error.response.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erro ao registrar pagamentos do mês.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Pagar fatura de ${monthLabel}`}
    >
      <div className="space-y-4 text-sm sm:text-base">
        {pendingItems.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            Não há pendências para este mês.
          </p>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              Você está prestes a registrar o pagamento das pendências deste mês.
              {!selectedCardId && " Selecione um cartão para pagar apenas as transações dele, ou deixe vazio para pagar tudo."}
            </p>

            {/* Card selector */}
            {cardOptions.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-900/30">
                <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 block">
                  💳 Cartão
                </label>
                <Autocomplete
                  options={cardOptions}
                  value={selectedCardId}
                  onChange={handleCardSelect}
                  placeholder="Todos os cartões"
                  name="pay_card_id"
                />
                {selectedCardId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCardId("")}
                    className="mt-1.5 text-[10px] sm:text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Limpar seleção (pagar todas)
                  </button>
                )}
                {selectedCardId && (
                  <p className="mt-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                    Mostrando {pendingItems.length} de {allPendingCount} pendências
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 text-xs sm:text-sm shadow-sm dark:border-gray-800 dark:bg-[#050505]">
              <p className="mb-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Pendências do mês
              </p>
              <ScrollArea maxHeightClassName="max-h-64" className="space-y-2 pr-1">
                {pendingItems.map((item) => {
                  const totalInstallments = item.total_installments || 1;
                  const currentInstallment = item.current_installment || 0;
                  const installmentAmount = (item.amount || 0) / totalInstallments;
                  const logicalInstallment =
                    totalInstallments > 1
                      ? item.display_installment || Math.min(currentInstallment + 1, totalInstallments)
                      : 1;

                  const remainingInstallments = Math.max(
                    totalInstallments - (logicalInstallment - 1),
                    0
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-2.5 py-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Parcela atual: {logicalInstallment}/{totalInstallments} •
                          Valor da parcela: {formatCurrency(installmentAmount)}
                        </p>
                      </div>
                      <div className="text-right text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        <p>Restantes: {remainingInstallments}</p>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>

              <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-[11px] sm:text-xs dark:border-gray-700">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Total a pagar agora
                </span>
                <span className="font-semibold themed-amount">
                  {formatCurrency(totalToPay)}
                </span>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Observação: faturas parceladas só serão marcadas como "pagas" quando
              todas as parcelas forem quitadas.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <SecondaryButton
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancelar
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={isSubmitting || pendingItems.length === 0}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Registrando..." : "Confirmar pagamento"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
