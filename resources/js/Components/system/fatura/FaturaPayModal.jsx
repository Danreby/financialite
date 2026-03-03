import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CreditCard, Landmark, AlertTriangle, Info } from "lucide-react";
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

// ─── Confirmation step shown before actually submitting ─────────────────────
function FaturaPayConfirmation({
  pendingItems,
  totalToPay,
  selectedCardName,
  monthLabel,
  isAllCards,
  onConfirm,
  onBack,
  isSubmitting,
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 sm:p-4 dark:border-amber-700/60 dark:bg-amber-900/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1.5">
            <p className="text-[12px] sm:text-[13px] font-semibold text-amber-800 dark:text-amber-300">
              Confirmação de pagamento
            </p>
            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400">
              {isAllCards
                ? `Você está prestes a pagar todas as ${pendingItems.length} transação(ões) pendente(s) de ${monthLabel}, independentemente do cartão vinculado.`
                : `Você está prestes a pagar ${pendingItems.length} transação(ões) pendente(s) de ${monthLabel} do cartão "${selectedCardName}".`}
            </p>
            {isAllCards && (
              <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 font-medium">
                Isso inclui transações sem cartão e de todos os cartões filtrados nesta fatura.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30 space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Resumo
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Transações a pagar</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingItems.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Total a debitar</span>
          <span className="font-bold themed-amount">{formatCurrency(totalToPay)}</span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <SecondaryButton
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs sm:text-sm font-medium"
        >
          Voltar
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          className="w-full sm:w-auto rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold"
        >
          {isSubmitting ? "Registrando…" : "Confirmar e pagar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────────────
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
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [selectedCardId, setSelectedCardId] = useState(
    bankUserId ? String(bankUserId) : ""
  );
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedCardId(bankUserId ? String(bankUserId) : "");
      setSelectedBankAccountId("");
      setStep("form");
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

  /**
   * When a card is selected, show only its pending items.
   * When no card is selected, show ALL pending items for the month.
   */
  const pendingItems = useMemo(() => {
    const pending = items.filter((item) => item.status !== "paid");
    if (!selectedCardId) return pending;
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

  /** Card is optional — only the bank account and at least one pending item are required. */
  const canPay =
    !isSubmitting &&
    !!selectedBankAccountId &&
    pendingItems.length > 0;

  const isAllCards = !selectedCardId;

  const handleRequestPay = () => {
    if (!canPay) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!canPay) return;
    setIsSubmitting(true);
    toast.dismiss();

    try {
      await axios.post(route("transacoes.pay_month"), {
        month: monthKey,
        bank_user_id: selectedCardId || null,
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
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && onClose) onClose();
  };

  // ── Render confirmation step ──────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        maxWidth="md"
        title={`Pagar fatura de ${monthLabel}`}
      >
        <FaturaPayConfirmation
          pendingItems={pendingItems}
          totalToPay={totalToPay}
          selectedCardName={selectedCardName}
          monthLabel={monthLabel}
          isAllCards={isAllCards}
          onConfirm={handleSubmit}
          onBack={() => setStep("form")}
          isSubmitting={isSubmitting}
        />
      </Modal>
    );
  }

  // ── Render form step ──────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={`Pagar fatura de ${monthLabel}`}
    >
      <div className="space-y-4 text-sm">
        {/* ── Card filter (optional) ───────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
          <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            Filtrar por cartão
            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-normal text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Opcional
            </span>
          </label>

          <Autocomplete
            options={cardOptions}
            value={selectedCardId}
            onChange={handleCardSelect}
            placeholder="Todos os cartões (sem filtro)…"
            name="pay_card_id"
          />

          {isAllCards ? (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] sm:text-xs text-blue-600 dark:text-blue-400">
              <Info className="mt-0.5 w-3.5 h-3.5 shrink-0" />
              <span>
                Sem filtro selecionado — todas as transações pendentes do mês serão pagas, incluindo as que não possuem cartão.
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Mostrando apenas transações do cartão selecionado.
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

        {/* ── Pending transactions list ──────────────────────────────── */}
        <FaturaCardTransactionList
          items={pendingItems}
          totalToPay={totalToPay}
          emptyMessage={
            isAllCards
              ? "Nenhuma transação pendente para este mês."
              : "Nenhuma transação pendente para este cartão neste mês."
          }
        />

        {pendingItems.length > 0 && (
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            Parcelas serão marcadas como pagas somente após quitar todas as
            prestações.
          </p>
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
          onClick={handleRequestPay}
          className="w-full sm:w-auto rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold"
        >
          {selectedCardName
            ? `Pagar · ${selectedCardName}`
            : `Pagar tudo (${pendingItems.length} transaç${pendingItems.length === 1 ? "ão" : "ões"})`}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
