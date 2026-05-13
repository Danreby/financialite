import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Landmark, Layers, RefreshCw } from "lucide-react";
import Modal from "../common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import BareButton from "@/Components/common/buttons/BareButton";
import { useNumericInput, useDecimalInput } from "@/Hooks/useNumericInput";

export default function ExpenseForm({ isOpen, onClose, onSuccess, bankAccounts = [], debitAccounts = [], categories = [] }) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [deductFromBank, setDeductFromBank] = useState(false);
  const [selectedDebitAccountId, setSelectedDebitAccountId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [installmentsDisplay, setInstallmentsDisplay] = useState("1");

  useEffect(() => {
    if (isOpen) {
      setIsRecurring(false);
      setIsSubmitting(false);
      setType("");
      setSelectedBankId("");
      setSelectedCategoryId("");
      setDeductFromBank(false);
      setSelectedDebitAccountId("");
      setAmountDisplay("");
      setInstallmentsDisplay("1");
    }
  }, [isOpen]);

  useEffect(() => {
    if (type !== "debit") {
      setDeductFromBank(false);
      setSelectedDebitAccountId("");
    }
  }, [type]);

  const handleNumericKeyDown = useNumericInput();
  const handleDecimalKeyDown = useDecimalInput();

  const MAX_AMOUNT = 1_000_000_000;

  const handleAmountInput = (event) => {
    const rawValue = event.target.value;
    if (!rawValue) {
      setAmountDisplay("");
      return;
    }
    const normalized = rawValue.replace(",", ".");
    const numeric = parseFloat(normalized);
    if (Number.isNaN(numeric)) return;
    if (numeric > MAX_AMOUNT) {
      event.target.value = String(MAX_AMOUNT);
    }
    setAmountDisplay(event.target.value);
  };

  const handleInstallmentsInput = (event) => {
    const rawValue = event.target.value;
    if (!rawValue) {
      setInstallmentsDisplay("");
      return;
    }
    const numeric = parseInt(rawValue, 10);
    if (Number.isNaN(numeric)) return;
    if (numeric > 360) {
      event.target.value = "360";
    }
    setInstallmentsDisplay(event.target.value);
  };

  const parsedAmt = parseFloat(amountDisplay);
  const parsedInst = parseInt(installmentsDisplay, 10);
  const showInstallmentPreview =
    type === "credit" &&
    !isRecurring &&
    !Number.isNaN(parsedAmt) &&
    parsedAmt > 0 &&
    !Number.isNaN(parsedInst) &&
    parsedInst > 1;
  const perInstallment = showInstallmentPreview ? parsedAmt / parsedInst : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title")?.toString().trim();
    const amount = formData.get("amount")?.toString().trim();
    const submittedType = type;
    const formElement = e.currentTarget;

    toast.dismiss();

    if (!title) {
      toast.error("Informe o título da transação.");
      formElement.elements.namedItem("title")?.focus();
      setIsSubmitting(false);
      return;
    }

    if (!amount) {
      toast.error("Informe o valor da transação.");
      formElement.elements.namedItem("amount")?.focus();
      setIsSubmitting(false);
      return;
    }

    if (!submittedType) {
      toast.error("Selecione o tipo: débito ou crédito.");
      const debitRadio = formElement.querySelector('input[name="type"][value="debit"]');
      debitRadio?.focus();
      setIsSubmitting(false);
      return;
    }
    const totalInstallmentsRaw = formData.get("total_installments")?.toString().trim();
    const isDebit = submittedType === "debit";
    const effectiveRecurring = isDebit ? false : isRecurring;
    const totalInstallments = isDebit
      ? "1"
      : effectiveRecurring
        ? "1"
        : (totalInstallmentsRaw || "1");

    const payload = {
      title,
      description: formData.get("description")?.toString().trim() || "",
      amount,
      type: submittedType,
      total_installments: totalInstallments,
      is_recurring: effectiveRecurring ? 1 : 0,
      bank_user_id: selectedBankId || null,
      category_id: selectedCategoryId || null,
      debit_account_id: deductFromBank && selectedDebitAccountId ? selectedDebitAccountId : null,
    };

    axios
      .post(route("transacoes.store"), payload)
      .then((response) => {
        toast.dismiss();
        toast.success("Transação criada com sucesso.");
        formElement.reset();
        setIsRecurring(false);
        setType("");
        setSelectedBankId("");
        setSelectedCategoryId("");
        setDeductFromBank(false);
        setSelectedDebitAccountId("");
        setIsSubmitting(false);
        if (onSuccess) onSuccess(response.data || {});
        if (onClose) onClose();
      })
      .catch((error) => {
        toast.dismiss();
        setIsSubmitting(false);

        if (error.response && error.response.status === 422) {
          const data = error.response.data || {};
          const errors = data.errors || {};

          if (errors.title?.[0]) {
            toast.error(errors.title[0]);
            formElement.elements.namedItem("title")?.focus();
            return;
          }

          if (errors.amount?.[0]) {
            toast.error(errors.amount[0]);
            formElement.elements.namedItem("amount")?.focus();
            return;
          }

          if (errors.type?.[0]) {
            toast.error(errors.type[0]);
            const debitRadio = formElement.querySelector(
              'input[name="type"][value="debit"]'
            );
            debitRadio?.focus();
            return;
          }

          if (errors.bank_user_id?.[0]) {
            toast.error(errors.bank_user_id[0]);
            formElement.elements.namedItem("bank_user_id")?.focus();
            return;
          }

          if (errors.category_id?.[0]) {
            toast.error(errors.category_id[0]);
            formElement.elements.namedItem("category_id")?.focus();
            return;
          }

          if (data.message) {
            toast.error(data.message);
            return;
          }

          toast.error("Erro de validação ao criar transação.");
          return;
        }

        toast.error("Erro ao criar transação.");
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" title="Nova Despesa">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>

        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Tipo de transação <span className="text-red-400 normal-case">*</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "debit",
                label: "Débito",
                sub: "Saída da conta",
                icon: "💸",
                activeBorder: "border-rose-500",
                activeBg: "bg-rose-50 dark:bg-rose-500/10",
                activeDot: "bg-rose-500",
                activeTitle: "text-rose-700 dark:text-rose-400",
                activeSub: "text-rose-400 dark:text-rose-400/70",
              },
              {
                value: "credit",
                label: "Crédito",
                sub: "Cartão de crédito",
                icon: "💳",
                activeBorder: "border-[var(--theme-accent)]",
                activeBg: "bg-[var(--theme-accent)]/5 dark:bg-[var(--theme-accent)]/10",
                activeDot: "bg-[var(--theme-accent)]",
                activeTitle: "text-[var(--theme-accent)]",
                activeSub: "text-[var(--theme-accent)]/60",
              },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  type === t.value
                    ? `${t.activeBorder} ${t.activeBg}`
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:border-gray-600"
                }`}
              >
                {type === t.value && (
                  <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${t.activeDot}`} />
                )}
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <p className={`text-sm font-bold leading-tight ${type === t.value ? t.activeTitle : "text-gray-800 dark:text-gray-200"}`}>
                    {t.label}
                  </p>
                  <p className={`mt-0.5 text-xs leading-tight ${type === t.value ? t.activeSub : "text-gray-400 dark:text-gray-500"}`}>
                    {t.sub}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              placeholder="Ex: Supermercado, Netflix…"
              maxLength={120}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Valor <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                R$
              </span>
              <input
                name="amount"
                type="number"
                placeholder="0,00"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                maxLength={12}
                required
                onKeyDown={handleDecimalKeyDown}
                onInput={handleAmountInput}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {type === "credit" && (
          <div className="rounded-xl border border-[var(--theme-accent)]/25 bg-[var(--theme-accent)]/5 p-4 dark:bg-[var(--theme-accent)]/10">
            {/* <div className="mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[var(--theme-accent)]" />
              <span className="text-xs font-semibold text-[var(--theme-accent)]">Opções de crédito</span>
            </div> */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Parcelas (1–360)
                </label>
                <input
                  name="total_installments"
                  type="number"
                  defaultValue="1"
                  min="1"
                  max="360"
                  inputMode="numeric"
                  maxLength={3}
                  disabled={isRecurring}
                  onKeyDown={handleNumericKeyDown}
                  onInput={handleInstallmentsInput}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:bg-[#0f0f0f] dark:text-gray-100 ${
                    isRecurring
                      ? "cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-800"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                />
                {showInstallmentPreview && (
                  <p className="mt-1.5 text-[11px] font-semibold text-[var(--theme-accent)]">
                    ≈ R${" "}
                    {perInstallment.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    por parcela
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Recorrente
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecurring((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all ${
                    isRecurring
                      ? "border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/20"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-[#0f0f0f]"
                  }`}
                >
                  <span className={`flex items-center gap-2 text-xs font-medium ${isRecurring ? "text-[var(--theme-accent)]" : "text-gray-500 dark:text-gray-400"}`}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isRecurring ? "Mensal automático" : "Ativar recorrência"}
                  </span>
                  <div className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${isRecurring ? "themed-toggle-on" : "bg-gray-300 dark:bg-gray-700"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isRecurring ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Categoria
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Cartão
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Sem cartão</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {type === "debit" && debitAccounts.length > 0 && (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:p-3.5 dark:border-gray-700 dark:bg-gray-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 sm:text-sm">
                  Subtrair de conta bancária
                </span>
              </div>
              <BareButton
                type="button"
                onClick={() => {
                  setDeductFromBank((prev) => {
                    const next = !prev;
                    if (!next) setSelectedDebitAccountId("");
                    return next;
                  });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 themed-ring focus:ring-offset-2 ${
                  deductFromBank ? "themed-toggle-on" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${deductFromBank ? "translate-x-5" : "translate-x-1"}`} />
              </BareButton>
            </div>
            {deductFromBank && (
              <div className="flex flex-col gap-1.5">
                <select
                  value={selectedDebitAccountId}
                  onChange={(e) => setSelectedDebitAccountId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 sm:text-sm"
                >
                  <option value="">Selecione uma conta</option>
                  {debitAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {typeof account.balance === "number"
                        ? ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(account.balance)}`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  O valor da despesa será debitado do saldo da conta selecionada.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Descrição{" "}
            <span className="text-[11px] font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            name="description"
            placeholder="Detalhes sobre esta despesa…"
            rows={2}
            maxLength={250}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <SecondaryButton type="button" onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Registrar Despesa"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}