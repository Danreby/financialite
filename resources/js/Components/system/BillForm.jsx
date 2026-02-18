import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from "@/Utils/categoryIcons";
import { AlertCircle } from "lucide-react";
import ScrollArea from "../common/ScrollArea";

export default function BillForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  categories = [],
  bill = null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('FileText');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [recurrenceType, setRecurrenceType] = useState('monthly');

  useEffect(() => {
    if (bill) {
      setSelectedIcon(bill.icon || 'FileText');
      setSelectedColor(bill.color || '#3b82f6');
      setRecurrenceType(bill.recurrence_type || 'monthly');
    } else {
      setSelectedIcon('FileText');
      setSelectedColor('#3b82f6');
      setRecurrenceType('monthly');
    }
  }, [bill, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const title = formData.get("title")?.toString().trim();
    const amount = formData.get("amount")?.toString().trim();
    const dueDay = formData.get("due_day")?.toString().trim();

    toast.dismiss();

    if (!title) {
      toast.error("Informe o título da conta.");
      form.elements.namedItem("title")?.focus();
      return;
    }

    if (!dueDay || parseInt(dueDay) < 1 || parseInt(dueDay) > 31) {
      toast.error("Informe um dia de vencimento válido (1-31).");
      form.elements.namedItem("due_day")?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description: formData.get("description")?.toString().trim() || null,
        amount: amount && parseFloat(amount) > 0 ? parseFloat(amount) : null,
        recurrence_type: recurrenceType,
        due_day: parseInt(dueDay),
        start_date: new Date().toISOString().split('T')[0],
        color: selectedColor,
        icon: selectedIcon,
        status: 'active',
        category_id: formData.get("category_id") || null,
      };

      if (bill) {
        await axios.put(route("bills.update", bill.id), payload);
        toast.success("Conta atualizada com sucesso.");
      } else {
        await axios.post(route("bills.store"), payload);
        toast.success("Conta cadastrada com sucesso.");
      }

      form.reset();
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      setIsSubmitting(false);

      if (error.response && error.response.status === 422) {
        const errors = error.response.data?.errors || {};
        const firstError = Object.values(errors)[0]?.[0];
        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      toast.error(bill ? "Erro ao atualizar conta." : "Erro ao cadastrar conta.");
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="3xl"
      title={bill ? "Editar Conta" : "Nova Conta a Pagar"}
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <ScrollArea className="max-h-[70vh] pr-1" style={{ paddingRight: '0.25rem' }}>
            {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">💡 Dica sobre contas recorrentes</p>
                    <p>Cadastre suas contas mensais (luz, água, internet) para receber lembretes 2 dias e 1 dia antes do vencimento. O valor pode ser deixado em branco se variar a cada mês.</p>
                    </div>
                </div>
            </div> */}

            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                    <FloatLabelField
                    key={`title-${bill?.id || 'new'}`}
                    id="title"
                    name="title"
                    type="text"
                    label="Nome da conta"
                    defaultValue={bill?.title}
                    inputProps={{
                        maxLength: 255,
                        placeholder: 'Ex: Conta de Luz, Netflix, Aluguel',
                        autoComplete: 'off'
                    }}
                    isRequired
                    />

                    <FloatLabelField
                    key={`description-${bill?.id || 'new'}`}
                    id="description"
                    name="description"
                    type="text"
                    label="Descrição (opcional)"
                    defaultValue={bill?.description}
                    inputProps={{
                        maxLength: 500,
                        placeholder: 'Detalhes adicionais sobre a conta',
                        autoComplete: 'off'
                    }}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FloatLabelField
                    key={`due_day-${bill?.id || 'new'}`}
                    id="due_day"
                    name="due_day"
                    type="number"
                    label="Dia do vencimento"
                    defaultValue={bill?.due_day}
                    inputProps={{
                        min: '1',
                        max: '31',
                        placeholder: 'Ex: 10',
                        autoComplete: 'off'
                    }}
                    isRequired
                    />

                    <FloatLabelField
                    key={`amount-${bill?.id || 'new'}`}
                    id="amount"
                    name="amount"
                    type="number"
                    label="Valor estimado (opcional)"
                    defaultValue={bill?.amount}
                    inputProps={{
                        step: '0.01',
                        min: '0.01',
                        placeholder: 'R$ 0,00',
                        autoComplete: 'off'
                    }}
                    //   helperText="Deixe vazio se o valor varia"
                    />

                    <div>
                    {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recorrência *
                    </label> */}
                    <select
                        name="recurrence_type"
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 transition-colors"
                        required
                    >
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                        <option value="none">Pagamento único</option>
                    </select>
                    </div>
                </div>

                <div>
                    {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                    </label> */}
                    <select
                    key={`category-${bill?.id || 'new'}`}
                    name="category_id"
                    defaultValue={bill?.category_id || ''}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 transition-colors"
                    >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                        {category.name}
                        </option>
                    ))}
                    </select>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Personalização Visual
            </h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Ícone
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                {AVAILABLE_ICONS.map((iconItem) => (
                    <button
                    key={iconItem.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconItem.name)}
                    className={`flex items-center justify-center p-2.5 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedIcon === iconItem.name
                        ? 'themed-selected border-theme-accent shadow-sm'
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:bg-gray-800'
                    }`}
                    title={iconItem.label}
                    >
                    <span className="text-xl">{iconItem.icon}</span>
                    </button>
                ))}
                </div>
            </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cor
                    </label>
                    <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-2">
                    {AVAILABLE_COLORS.map((colorItem) => (
                        <button
                        key={colorItem.hex}
                        type="button"
                        onClick={() => setSelectedColor(colorItem.hex)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                            selectedColor === colorItem.hex
                            ? 'border-gray-900 dark:border-white ring-2 ring-theme-accent ring-offset-2 dark:ring-offset-gray-900'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                        title={colorItem.name}
                        style={{ backgroundColor: colorItem.hex }}
                        />
                    ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <SecondaryButton type="button" onClick={handleClose} className="w-full sm:w-auto">
                    Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Salvando..." : bill ? "Atualizar Conta" : "Cadastrar Conta"}
                </PrimaryButton>
            </div>
        </ScrollArea>
      </form>
    </Modal>
  );
}
