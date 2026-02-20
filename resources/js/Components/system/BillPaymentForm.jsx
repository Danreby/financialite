import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import { DollarSign, Calendar, AlertTriangle } from "lucide-react";

export default function BillPaymentForm({
  isOpen,
  onClose,
  onSuccess,
  bill = null,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!bill) return null;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const today = new Date().toISOString().split("T")[0];
  const dueDate = bill.due_date || bill.date;
  const isOverdue =
    bill.status === "overdue" ||
    bill.is_overdue ||
    (dueDate && new Date(dueDate) < new Date(today));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const amountPaid = formData.get("amount_paid")?.toString().trim();
    const paidDate = formData.get("paid_date")?.toString().trim();

    toast.dismiss();

    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      toast.error("Informe o valor pago.");
      form.elements.namedItem("amount_paid")?.focus();
      return;
    }

    if (!paidDate) {
      toast.error("Informe a data do pagamento.");
      form.elements.namedItem("paid_date")?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(route("bills.pay", bill.id), {
        due_date: dueDate,
        paid_date: paidDate,
        amount_paid: parseFloat(amountPaid),
      });

      toast.success("Pagamento registrado com sucesso!");
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      setIsSubmitting(false);

      if (error.response?.status === 422) {
        const errors = error.response.data?.errors || {};
        const firstError = Object.values(errors)[0]?.[0];
        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return;
      }

      toast.error("Erro ao registrar pagamento.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title="Registrar Pagamento"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-base">
            {bill.title || bill.description}
          </h4>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Vencimento:{" "}
              {dueDate
                ? new Date(dueDate + "T00:00:00").toLocaleDateString("pt-BR")
                : "—"}
            </span>
            {bill.amount > 0 && (
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Estimado: {formatCurrency(bill.amount)}
              </span>
            )}
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Esta conta está em atraso
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatLabelField
            key={`amount_paid-${bill.id}-${dueDate}`}
            id="amount_paid"
            name="amount_paid"
            type="number"
            label="Valor pago"
            defaultValue={bill.amount > 0 ? bill.amount : ""}
            inputProps={{
              step: "0.01",
              min: "0.01",
              placeholder: "R$ 0,00",
              autoComplete: "off",
            }}
            isRequired
          />

          <FloatLabelField
            key={`paid_date-${bill.id}-${dueDate}`}
            id="paid_date"
            name="paid_date"
            type="date"
            label="Data do pagamento"
            defaultValue={today}
            inputProps={{
              autoComplete: "off",
            }}
            isRequired
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <SecondaryButton
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Registrando..." : "Confirmar Pagamento"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
