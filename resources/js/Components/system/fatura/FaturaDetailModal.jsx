import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Pencil, Check, Loader2, RotateCcw } from "lucide-react";
import Modal from "@/Components/common/Modal";
import AnexoSection from "@/Components/system/anexo/AnexoSection";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import FloatLabelSelect from "@/Components/common/inputs/FloatLabelSelect";
import CategoryBadge from "@/Components/common/CategoryBadge";
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

function buildEditData(item) {
  if (!item) return {};
  return {
    title: item.title || "",
    description: item.description || "",
    amount: item.amount != null ? String(item.amount) : "",
    type: item.type || "debit",
    status: item.status || "unpaid",
    category_id: item.category_id ? String(item.category_id) : "",
    bank_user_id: item.bank_user_id ? String(item.bank_user_id) : "",
    paid_date: item.paid_date
      ? item.paid_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    total_installments: item.total_installments
      ? String(item.total_installments)
      : "1",
  };
}

export default function FaturaDetailModal({
  isOpen,
  onClose,
  item,
  bankAccounts = [],
  categories = [],
  onUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setEditData(buildEditData(item));
  }, [item]);

  const handleStartEdit = useCallback(() => setIsEditing(true), []);

  const handleCancelEdit = useCallback(() => {
    setEditData(buildEditData(item));
    setIsEditing(false);
  }, [item]);

  const handleClose = useCallback(() => {
    setIsEditing(false);
    onClose();
  }, [onClose]);

  const handleFieldChange = useCallback((field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!item || isSubmitting) return;
    const realId = item.transacao_id || item.id;
    if (!realId) return;

    if (!editData.title?.trim()) {
      toast.error("Informe o título da transação.");
      return;
    }
    if (!editData.amount || Number(editData.amount) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const isDebit = editData.type === "debit";
      const payload = {
        title: editData.title.trim(),
        description: editData.description?.trim() || null,
        amount: Number(editData.amount),
        type: editData.type,
        bank_user_id: editData.bank_user_id || null,
        category_id: editData.category_id || null,
        total_installments: isDebit
          ? 1
          : Math.max(
              Number(editData.total_installments) || 1,
              Number(item.current_installment) || 1,
            ),
        is_recurring: isDebit ? 0 : item.is_recurring ? 1 : 0,
        status: editData.status,
        paid_date:
          editData.status === "paid"
            ? editData.paid_date || new Date().toISOString().slice(0, 10)
            : null,
      };

      await axios.put(route("transacoes.update", realId), payload);
      toast.success("Transação atualizada com sucesso.");
      setIsEditing(false);
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erro ao atualizar transação.");
    } finally {
      setIsSubmitting(false);
    }
  }, [item, editData, isSubmitting, onUpdated]);

  if (!item) return null;

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
    category_icon,
    category_color,
  } = item;

  const realTransacaoId = transacao_id || id;
  const totalInstallmentsNumber = Math.max(Number(total_installments || 1), 1);
  const rawAmountNumber = Number(amount || 0) || 0;
  const installmentAmount = item.installment_amount ?? (
    totalInstallmentsNumber > 1
      ? rawAmountNumber / totalInstallmentsNumber
      : rawAmountNumber
  );
  const hasInstallments = totalInstallmentsNumber > 1;
  const statusLabel =
    status === "paid"
      ? "Pago ✔️"
      : status === "overdue"
      ? "Vencido ❌"
      : "Em aberto ⌛";
  const typeLabel =
    type === "credit" ? "Crédito" : type === "debit" ? "Débito" : "-";
  const effectiveInstallmentNumber =
    total_installments && total_installments > 1
      ? display_installment || current_installment || 1
      : null;

  const canEdit = !!realTransacaoId;

  const headerActions = canEdit ? (
    isEditing ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isSubmitting}
          title="Cancelar edição"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3 flex-shrink-0" />
          <span className="hidden sm:inline">Cancelar</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          title="Salvar alterações"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold bg-[var(--theme-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
        >
          {isSubmitting ? (
            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
          ) : (
            <Check className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isSubmitting ? "Salvando…" : "Salvar"}
          </span>
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={handleStartEdit}
        title="Editar transação"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Pencil className="w-3 h-3 flex-shrink-0" />
        {/* <span className="hidden sm:inline">Editar</span> */}
      </button>
    )
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      title="Detalhes da transação"
      headerActions={headerActions}
    >
      {isEditing ? (
        <div className="space-y-4 pt-1">
          <FloatLabelField
            id="fdt_title"
            label="Título"
            isRequired
            value={editData.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            inputProps={{ maxLength: 120 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatLabelField
              id="fdt_amount"
              label="Valor (R$)"
              isRequired
              type="number"
              value={editData.amount || ""}
              onChange={(e) => handleFieldChange("amount", e.target.value)}
              inputProps={{ min: "0.01", step: "0.01", inputMode: "decimal" }}
            />

            <div className="relative px-3">
              {/* <span className="pointer-events-none absolute left-3 top-1.5 select-none text-[0.7rem] font-medium tracking-wide text-gray-500 dark:text-gray-400">
                Tipo
              </span> */}
              <div className="flex gap-2">
                {["debit", "credit"].map((t) => (
                  <label
                    key={t}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      editData.type === t
                        ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fdt_type"
                      value={t}
                      checked={editData.type === t}
                      onChange={() => handleFieldChange("type", t)}
                      className="sr-only"
                    />
                    {t === "debit" ? "Débito" : "Crédito"}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {editData.type === "credit" && !is_recurring && (
            <FloatLabelField
              id="fdt_installments"
              label="Total de parcelas"
              type="number"
              value={editData.total_installments || "1"}
              onChange={(e) =>
                handleFieldChange("total_installments", e.target.value)
              }
              // helperText={
              //   current_installment && Number(current_installment) > 1
              //     ? `Parcela atual: ${current_installment} de ${
              //         editData.total_installments || total_installments
              //       }`
              //     : "Altere o total caso tenha negociado um novo número de parcelas"
              // }
              inputProps={{
                min: String(Math.max(Number(current_installment) || 1, 1)),
                max: "360",
                step: "1",
                inputMode: "numeric",
              }}
            />
          )}

          <FloatLabelField
            id="fdt_desc"
            as="textarea"
            label="Descrição"
            value={editData.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            inputProps={{ maxLength: 250 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatLabelSelect
              id="fdt_category"
              label="Categoria"
              value={editData.category_id || ""}
              onChange={(e) => handleFieldChange("category_id", e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </FloatLabelSelect>

            <FloatLabelSelect
              id="fdt_bank"
              label="Conta / Banco"
              value={editData.bank_user_id || ""}
              onChange={(e) =>
                handleFieldChange("bank_user_id", e.target.value)
              }
            >
              <option value="">Sem conta vinculada</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </FloatLabelSelect>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Marcar como pago
            </span>
            <button
              type="button"
              onClick={() =>
                handleFieldChange(
                  "status",
                  editData.status === "paid" ? "unpaid" : "paid"
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                editData.status === "paid"
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  editData.status === "paid" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {editData.status === "paid" && (
            <FloatLabelField
              id="fdt_paid_date"
              label="Data de pagamento"
              type="date"
              value={editData.paid_date || ""}
              onChange={(e) => handleFieldChange("paid_date", e.target.value)}
            />
          )}

          <div className="flex gap-2 pt-2 sm:hidden">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[var(--theme-accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 text-base sm:text-lg text-gray-800 dark:text-gray-200">
          <div>
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Título
            </p>
            <p className="mt-0.5 sm:mt-1 text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {title}
            </p>
            {description && (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Valor total
              </p>
              <p className="text-sm sm:text-base md:text-lg font-semibold themed-amount">
                {formatCurrency(rawAmountNumber)}
              </p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Valor do mês
              </p>
              <p className="text-sm sm:text-base md:text-lg font-semibold themed-amount">
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
              <p className="text-xs sm:text-sm md:text-base truncate">
                {bank_name || "-"}
              </p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Categoria
              </p>
              {category_name ? (
                <CategoryBadge
                  name={category_name}
                  icon={category_icon}
                  color={category_color}
                  size="md"
                />
              ) : (
                <p className="text-xs sm:text-sm md:text-base truncate">-</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Data da compra
              </p>
              <p className="text-xs sm:text-sm md:text-base">
                {formatFullDate(created_at)}
              </p>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Data de pagamento
              </p>
              <p className="text-xs sm:text-sm md:text-base">
                {formatFullDate(paid_date)}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Parcelamento / recorrência
            </p>
            {is_recurring ? (
              <p className="text-xs sm:text-sm md:text-base">
                Transação recorrente.
              </p>
            ) : hasInstallments ? (
              <>
                <p className="text-xs sm:text-sm md:text-base">
                  {`Valor por parcela: ${formatCurrency(installmentAmount)}`}
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {effectiveInstallmentNumber && (
                    <span className="mr-3">
                      Parcelas:{" "}
                      <span className="font-semibold">
                        {effectiveInstallmentNumber}/{totalInstallmentsNumber}
                      </span>
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
      )}
    </Modal>
  );
}
