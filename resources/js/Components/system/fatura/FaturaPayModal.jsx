import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CreditCard, Landmark, AlertTriangle } from "lucide-react";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import Autocomplete from "@/Components/common/inputs/Autocomplete";
import FaturaCardTransactionList from "@/Components/system/fatura/FaturaCardTransactionList";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function FaturaPayModal({
  isOpen,
  onClose,
  monthKey,
  monthLabel,
  items = [],
  bankUserId = null,
  bankAccounts = [],
  debitAccounts = [],
  onPaid,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(
    bankUserId ? String(bankUserId) : ""
  );
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedCardId(bankUserId ? String(bankUserId) : "");
      setSelectedBankAccountId("");
    }
  }, [isOpen, bankUserId]);

  const cardOptions = useMemo(
    () =>
      bankAccounts.map((acc) => ({
        value: String(acc.id),
        label: acc.name,
      })),
    [bankAccounts]
  );

  const bankAccountOptions = useMemo(
    () =>
      debitAccounts.map((acc) => ({
        value: String(acc.id),
        label: `${acc.name} · ${formatCurrency(acc.balance)}`,
      })),
    [debitAccounts]
  );

  const handleCardSelect = useCallback((value) => {
    setSelectedCardId(value ? String(value) : "");
  }, []);

  const handleBankAccountSelect = useCallback((value) => {
    setSelectedBankAccountId(value ? String(value) : "");
  }, []);

  const pendingItems = useMemo(() => {
    const pending = items.filter((item) => item.status !== "paid");
    if (!selectedCardId) return [];
    return pending.filter(
      (item) => String(item.bank_user_id) === selectedCardId
    );
  }, [items, selectedCardId]);

  const totalToPay = useMemo(
    () =>
      pendingItems.reduce((sum, item) => {
        const installments = Math.max(item.total_installments || 1, 1);
        return sum + (item.amount || 0) / installments;
      }, 0),
    [pendingItems]
  );

  const selectedCardName = useMemo(
    () =>
      bankAccounts.find((a) => String(a.id) === selectedCardId)?.name ?? null,
    [bankAccounts, selectedCardId]
  );

  const selectedBankAccount = useMemo(
    () =>
      debitAccounts.find((a) => String(a.id) === selectedBankAccountId) ?? null,
    [debitAccounts, selectedBankAccountId]
  );

  const isInsufficientBalance =
    selectedBankAccount && totalToPay > 0 && selectedBankAccount.balance < totalToPay;

  const canPay =
    !isSubmitting &&
    !!selectedCardId &&
    !!selectedBankAccountId &&
    pendingItems.length > 0;

  const handleSubmit = async () => {
    if (!canPay) return;
    setIsSubmitting(true);
    toast.dismiss();

    try {
      await axios.post(route("transacoes.pay_month"), {
        month: monthKey,
        bank_user_id: selectedCardId,
        bank_account_id: selectedBankAccountId,
      });

      toast.success("Pagamentos registrados com sucesso.");
      if (onPaid) onPaid();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ??
        "Erro ao registrar pagamentos do mês.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && onClose) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={`Pagar fatura de ${monthLabel}`}
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
          <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            Cartão
          </label>

          <Autocomplete
            options={cardOptions}
            value={selectedCardId}
            onChange={handleCardSelect}
            placeholder="Selecione um cartão…"
            name="pay_card_id"
          />

          {!selectedCardId && (
            <p className="mt-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Selecione o cartão para ver as transações pendentes da fatura.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
          <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            Conta bancária para pagamento
          </label>

          <Autocomplete
            options={bankAccountOptions}
            value={selectedBankAccountId}
            onChange={handleBankAccountSelect}
            placeholder="Selecione a conta…"
            name="pay_bank_account_id"
          />

          {selectedBankAccount && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Saldo disponível</span>
                <span className={`font-semibold ${
                  isInsufficientBalance
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatCurrency(selectedBankAccount.balance)}
                </span>
              </div>

              {totalToPay > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Saldo após pagamento</span>
                  <span className={`font-medium ${
                    isInsufficientBalance
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formatCurrency(selectedBankAccount.balance - totalToPay)}
                  </span>
                </div>
              )}

              {isInsufficientBalance && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Saldo insuficiente para cobrir o valor total da fatura</span>
                </div>
              )}
            </div>
          )}

          {!selectedBankAccountId && (
            <p className="mt-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Selecione a conta bancária de onde o pagamento será debitado.
            </p>
          )}
        </div>

        {selectedCardId && (
          <>
            <FaturaCardTransactionList
              items={pendingItems}
              totalToPay={totalToPay}
            />

            {pendingItems.length > 0 && (
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Parcelas serão marcadas como pagas somente após quitar todas as
                prestações.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <SecondaryButton
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs sm:text-sm font-medium"
        >
          Cancelar
        </SecondaryButton>

        <PrimaryButton
          type="button"
          disabled={!canPay}
          onClick={handleSubmit}
          className="w-full sm:w-auto rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold"
        >
          {isSubmitting
            ? "Registrando…"
            : selectedCardName
            ? `Pagar fatura · ${selectedCardName}`
            : "Confirmar pagamento"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
