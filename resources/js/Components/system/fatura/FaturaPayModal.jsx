import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertTriangle, CreditCard, Landmark, SplitSquareHorizontal, Wallet } from "lucide-react";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import Autocomplete from "@/Components/common/inputs/Autocomplete";
import FaturaCardTransactionList from "@/Components/system/fatura/FaturaCardTransactionList";
import { formatCurrency } from "@/Lib/formatters";

function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange("full")}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] sm:text-xs font-semibold transition-all ${
          mode === "full"
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        <CreditCard className="w-3.5 h-3.5 shrink-0" />
        Pagar tudo
      </button>
      <button
        type="button"
        onClick={() => onChange("partial")}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] sm:text-xs font-semibold transition-all ${
          mode === "partial"
            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        <SplitSquareHorizontal className="w-3.5 h-3.5 shrink-0" />
        Valor personalizado
      </button>
    </div>
  );
}

function PartialAmountInput({ value, onChange, remaining, totalSpent, totalPaid, error }) {
  const presets = useMemo(() => {
    if (!remaining || remaining <= 0) return [];
    const suggestions = [];
    const half = +(remaining / 2).toFixed(2);
    if (half > 0.01 && half < remaining) suggestions.push({ label: "50%", value: half });
    suggestions.push({ label: "Restante", value: remaining });
    return suggestions;
  }, [remaining]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 overflow-hidden">
        <div className="flex flex-col items-center py-2.5 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Total</span>
          <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="flex flex-col items-center py-2.5 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Pago</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="flex flex-col items-center py-2.5 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">A pagar</span>
          <span className="text-xs sm:text-sm font-bold themed-amount mt-0.5">{formatCurrency(remaining)}</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Valor a pagar agora
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 dark:text-gray-500">R$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            max={remaining}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0,00"
            className={`w-full rounded-xl border pl-8 pr-3 py-2.5 text-sm font-semibold bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition focus:ring-2 focus:ring-[var(--theme-accent)] ${
              error
                ? "border-red-400 dark:border-red-600"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          />
        </div>
        {error && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Sugestões:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(String(p.value))}
              className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition"
            >
              {p.label} · {formatCurrency(p.value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PayConfirmation({ mode, pendingItems, totalToPay, selectedCardName, monthLabel, isAllCards, onConfirm, onBack, isSubmitting }) {
  const isPartial = mode === "partial";
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 sm:p-4 dark:border-amber-700/60 dark:bg-amber-900/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-[12px] sm:text-[13px] font-semibold text-amber-800 dark:text-amber-300">
              {isPartial ? "Confirmar pagamento parcial" : "Confirmar pagamento"}
            </p>
            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400">
              {isPartial
                ? `Um pagamento de ${formatCurrency(totalToPay)} será registrado para a fatura de ${monthLabel}. As transações individuais não serão alteradas.`
                : isAllCards
                ? `Você está prestes a pagar ${pendingItems.length} transação(ões) pendente(s) de ${monthLabel}, de todos os cartões.`
                : `Você está prestes a pagar ${pendingItems.length} transação(ões) pendente(s) de ${monthLabel} do cartão "${selectedCardName}".`}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30 space-y-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Resumo</p>
        {!isPartial && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Transações</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingItems.length}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">{isPartial ? "Valor a registrar" : "Total a debitar"}</span>
          <span className="font-bold themed-amount">{formatCurrency(totalToPay)}</span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <SecondaryButton type="button" onClick={onBack} disabled={isSubmitting} className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs sm:text-sm font-medium">
          Voltar
        </SecondaryButton>
        <PrimaryButton type="button" disabled={isSubmitting} onClick={onConfirm} className="w-full sm:w-auto rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold">
          {isSubmitting ? "Registrando…" : "Confirmar pagamento"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default function FaturaPayModal({
  isOpen,
  onClose,
  monthKey,
  monthLabel,
  items = [],
  totalSpent = 0,
  totalPaid = 0,
  bankUserId = null,
  bankAccounts = [],
  debitAccounts = [],
  onPaid,
  initialMode = "full",
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("form");
  const [mode, setMode] = useState(initialMode);
  const [selectedCardId, setSelectedCardId] = useState(bankUserId ? String(bankUserId) : "");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [partialAmountError, setPartialAmountError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedCardId(bankUserId ? String(bankUserId) : "");
      setSelectedBankAccountId("");
      setPartialAmount("");
      setPartialAmountError("");
      setStep("form");
      setMode(initialMode);
    }
  }, [isOpen, bankUserId, initialMode]);

  const cardOptions = useMemo(() => bankAccounts.map((a) => ({ value: String(a.id), label: a.name })), [bankAccounts]);
  const bankAccountOptions = useMemo(
    () => debitAccounts.map((a) => ({ value: String(a.id), label: `${a.name} · ${formatCurrency(a.balance)}` })),
    [debitAccounts]
  );

  const remaining = Math.max(0, totalSpent - totalPaid);

  const pendingItems = useMemo(() => {
    const pending = items.filter((item) => item.status !== "paid");
    if (!selectedCardId) return pending;
    return pending.filter((item) => String(item.bank_user_id) === selectedCardId);
  }, [items, selectedCardId]);

  const fullTotalToPay = useMemo(
    () => pendingItems.reduce((sum, item) => {
      const installments = Math.max(item.total_installments || 1, 1);
      const installmentAmount = item.installment_amount ?? (item.amount || 0) / installments;
      return sum + installmentAmount;
    }, 0),
    [pendingItems]
  );

  const selectedCardName = useMemo(() => bankAccounts.find((a) => String(a.id) === selectedCardId)?.name ?? null, [bankAccounts, selectedCardId]);
  const selectedBankAccount = useMemo(() => debitAccounts.find((a) => String(a.id) === selectedBankAccountId) ?? null, [debitAccounts, selectedBankAccountId]);

  const parsedPartialAmount = useMemo(() => { const n = parseFloat(partialAmount); return isNaN(n) ? 0 : n; }, [partialAmount]);

  const activeTotalToPay = mode === "full" ? fullTotalToPay : parsedPartialAmount;
  const isInsufficientBalance = selectedBankAccount && activeTotalToPay > 0 && selectedBankAccount.balance < activeTotalToPay;
  const isAllCards = !selectedCardId;

  const canProceed = useMemo(() => {
    if (isSubmitting) return false;
    if (mode === "full") return pendingItems.length > 0;
    return parsedPartialAmount > 0 && parsedPartialAmount <= remaining + 0.009 && remaining > 0;
  }, [isSubmitting, mode, pendingItems.length, parsedPartialAmount, remaining]);

  const handleCardSelect = useCallback((v) => setSelectedCardId(v ? String(v) : ""), []);
  const handleBankAccountSelect = useCallback((v) => setSelectedBankAccountId(v ? String(v) : ""), []);

  const handlePartialAmountChange = (raw) => {
    setPartialAmount(raw);
    setPartialAmountError("");
  };

  const validatePartial = () => {
    if (!partialAmount || parsedPartialAmount <= 0) { setPartialAmountError("Informe um valor maior que R$ 0,00."); return false; }
    if (parsedPartialAmount > remaining + 0.009) { setPartialAmountError(`O valor não pode exceder ${formatCurrency(remaining)}.`); return false; }
    return true;
  };

  const handleRequestPay = () => {
    if (mode === "partial" && !validatePartial()) return;
    if (!canProceed) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    toast.dismiss();
    try {
      if (mode === "full") {
        await axios.post(route("transacoes.pay_month"), {
          month: monthKey,
          bank_user_id: selectedCardId || null,
          bank_account_id: selectedBankAccountId || null,
        });
        toast.success("Pagamentos registrados com sucesso.");
      } else {
        await axios.post(route("transacoes.pay_partial"), {
          month: monthKey,
          amount: parsedPartialAmount,
          bank_user_id: selectedCardId || null,
          bank_account_id: selectedBankAccountId || null,
        });
        toast.success(`Pagamento de ${formatCurrency(parsedPartialAmount)} registrado.`);
      }
      if (onPaid) onPaid();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message ?? (mode === "full" ? "Erro ao registrar pagamentos do mês." : "Erro ao registrar pagamento parcial.");
      toast.error(message);
      setStep("form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => { if (!isSubmitting && onClose) onClose(); };

  if (step === "confirm") {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} maxWidth="md" title={`Pagar fatura de ${monthLabel}`}>
        <PayConfirmation
          mode={mode}
          pendingItems={pendingItems}
          totalToPay={activeTotalToPay}
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="md" title={`Pagar fatura de ${monthLabel}`}>
      <div className="space-y-4 text-sm">
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "full" && (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                Filtrar por cartão
                <span className="ml-1 rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-normal text-gray-500 dark:text-gray-400">Opcional</span>
              </label>
              <Autocomplete options={cardOptions} value={selectedCardId} onChange={handleCardSelect} placeholder="Todos os cartões (sem filtro)…" name="pay_card_id" />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Landmark className="w-3.5 h-3.5 shrink-0" />
                Conta para débito
                <span className="ml-1 rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-normal text-gray-500 dark:text-gray-400">Opcional</span>
              </label>
              <Autocomplete options={bankAccountOptions} value={selectedBankAccountId} onChange={handleBankAccountSelect} placeholder="Selecione a conta…" name="pay_bank_account_id" />
              {selectedBankAccount && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Saldo disponível</span>
                    <span className={`font-semibold ${isInsufficientBalance ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatCurrency(selectedBankAccount.balance)}
                    </span>
                  </div>
                  {fullTotalToPay > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Saldo após pagamento</span>
                      <span className={`font-medium ${isInsufficientBalance ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {formatCurrency(selectedBankAccount.balance - fullTotalToPay)}
                      </span>
                    </div>
                  )}
                  {isInsufficientBalance && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Saldo insuficiente para cobrir o valor total</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <FaturaCardTransactionList
              items={pendingItems}
              totalToPay={fullTotalToPay}
              emptyMessage={isAllCards ? "Nenhuma transação pendente para este mês." : "Nenhuma transação pendente para este cartão neste mês."}
            />
            {pendingItems.length > 0 && (
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Parcelas serão marcadas como pagas somente após quitar todas as prestações.
              </p>
            )}
          </>
        )}

        {mode === "partial" && (
          <>
            <PartialAmountInput
              value={partialAmount}
              onChange={handlePartialAmountChange}
              remaining={remaining}
              totalSpent={totalSpent}
              totalPaid={totalPaid}
              error={partialAmountError}
            />
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <label className="mb-2 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Landmark className="w-3.5 h-3.5 shrink-0" />
                Conta para débito
                <span className="ml-1 rounded-full bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-normal text-gray-500 dark:text-gray-400">Opcional</span>
              </label>
              <Autocomplete options={bankAccountOptions} value={selectedBankAccountId} onChange={handleBankAccountSelect} placeholder="Selecione a conta…" name="pay_partial_bank_account_id" />
              {selectedBankAccount && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Saldo disponível</span>
                    <span className={`font-semibold ${isInsufficientBalance ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatCurrency(selectedBankAccount.balance)}
                    </span>
                  </div>
                  {parsedPartialAmount > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Saldo após pagamento</span>
                      <span className={`font-medium ${isInsufficientBalance ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {formatCurrency(selectedBankAccount.balance - parsedPartialAmount)}
                      </span>
                    </div>
                  )}
                  {isInsufficientBalance && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Saldo insuficiente para cobrir este valor</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <SecondaryButton type="button" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs sm:text-sm font-medium">
          Cancelar
        </SecondaryButton>
        <PrimaryButton type="button" disabled={!canProceed} onClick={handleRequestPay} className="w-full sm:w-auto rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold">
          {mode === "full"
            ? selectedCardName
              ? `Pagar · ${selectedCardName}`
              : `Pagar tudo (${pendingItems.length} transaç${pendingItems.length === 1 ? "ão" : "ões"})`
            : parsedPartialAmount > 0
            ? `Pagar · ${formatCurrency(parsedPartialAmount)}`
            : "Pagar"}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
