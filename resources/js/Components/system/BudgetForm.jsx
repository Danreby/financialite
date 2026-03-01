import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import { Plus, Trash2, AlertCircle, Lightbulb } from "lucide-react";

const MAX_VALUE = 1000000000;
const MAX_CHARS = 10; 

function CategoryLimitRow({
  index,
  categoryLimit,
  categories,
  onChange, 
  onRemove,
  categoryLimitsAll,
  max = MAX_VALUE
}) {
  const [localLimit, setLocalLimit] = React.useState(
    categoryLimit.limit ?? ''
  );

  React.useEffect(() => {
    setLocalLimit(categoryLimit.limit ?? '');
  }, [categoryLimit.limit, categoryLimit._uid]);

  const handleBlur = () => {
    const raw = (localLimit ?? '').toString().trim();
    const num = raw === '' ? NaN : parseFloat(raw);

    if (!Number.isNaN(num)) {
      if (num > max) {
        const clamped = String(max);
        setLocalLimit(clamped);
        onChange(index, 'limit', clamped);
        toast.warn(`O valor máximo permitido por categoria é ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(max)}.`);
        return;
      }
      onChange(index, 'limit', String(num));
    } else {
      onChange(index, 'limit', '');
    }
  };

  const handleSelectChange = (e) => {
    onChange(index, 'category_id', e.target.value);
  };

  return (
    <div
      className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg items-start sm:items-center"
    >
      <div className="flex-1 w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
          Categoria
        </label>
        <select
          value={categoryLimit.category_id}
          onChange={handleSelectChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          required
        >
          <option value="">Selecione uma categoria</option>
          {categories
            .filter(cat =>
              !categoryLimitsAll.some((cl, i) => i !== index && cl.category_id == cat.id)
            )
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
          Limite (R$)
        </label>

        <input
          type="text"
          inputMode="decimal"
          value={localLimit}
          onChange={(e) => {
            let v = String(e.target.value || '');
            if (v.length > MAX_CHARS) v = v.slice(0, MAX_CHARS);
            setLocalLimit(v);
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          onPaste={(e) => {
            const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
            e.preventDefault();
            const before = localLimit || '';
            const combined = (before + paste).slice(0, MAX_CHARS);
            setLocalLimit(combined);
          }}
          placeholder="R$ 0,00"
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          required
        />
        {/* <p className="text-[10px] text-gray-400 mt-1">Máx. {MAX_CHARS} caracteres</p> */}
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="w-full sm:w-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2 sm:gap-0"
        title="Remover"
      >
        <Trash2 className="w-5 h-5" />
        <span className="text-sm sm:hidden">Remover</span>
      </button>
    </div>
  );
}

export default function BudgetForm({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  budget = null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [monthlyLimit, setMonthlyLimit] = useState('');

  const isEditing = !!budget?.id;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  useEffect(() => {
    if (isOpen) {
      setMonthlyLimit(budget?.monthly_limit ?? '');

      if (budget?.category_limits) {
        setCategoryLimits(
          budget.category_limits.map((cl, i) => ({
            _uid: `existing-${cl.category_id}-${i}`,
            category_id: String(cl.category_id),
            limit: cl.limit
          }))
        );
      } else {
        setCategoryLimits([]);
      }
    } else {
      setMonthlyLimit('');
      setCategoryLimits([]);
    }
  }, [budget, isOpen]);

  const handleAddCategoryLimit = () => {
    setCategoryLimits(prev => [
      ...prev,
      {
        _uid: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category_id: '',
        limit: ''
      }
    ]);
  };

  const handleRemoveCategoryLimit = (index) => {
    setCategoryLimits(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryLimitChange = (index, field, value) => {
    setCategoryLimits(prev =>
      prev.map((cl, i) =>
        i === index ? { ...cl, [field]: value } : cl
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const monthlyLimitRaw = (monthlyLimit ?? '').toString().trim();
    const monthlyLimitNum = monthlyLimitRaw === '' ? NaN : parseFloat(monthlyLimitRaw);

    toast.dismiss();

    if (Number.isNaN(monthlyLimitNum) || monthlyLimitNum < 0) {
      toast.error("Informe um limite mensal válido.");
      return;
    }

    if (monthlyLimitNum > MAX_VALUE) {
      toast.error(`O limite mensal não pode exceder ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(MAX_VALUE)}.`);
      return;
    }

    const hasEmptyLimit = categoryLimits.some(cl =>
      cl.category_id && (!cl.limit || cl.limit === '' || Number.isNaN(parseFloat(cl.limit)) || parseFloat(cl.limit) < 0)
    );

    if (hasEmptyLimit) {
      toast.error("Preencha o limite para todas as categorias adicionadas.");
      return;
    }

    const validCategoryLimits = categoryLimits.filter(cl => {
      const num = parseFloat(cl.limit);
      return cl.category_id && cl.limit !== '' && !Number.isNaN(num) && num >= 0 && num <= MAX_VALUE;
    });

    const invalidOverMax = categoryLimits.some(cl =>
      cl.limit && !Number.isNaN(parseFloat(cl.limit)) && parseFloat(cl.limit) > MAX_VALUE
    );
    if (invalidOverMax) {
      toast.error(`Cada limite de categoria não pode exceder ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(MAX_VALUE)}.`);
      return;
    }

    const categoryIds = validCategoryLimits.map(cl => cl.category_id);
    const uniqueCategoryIds = new Set(categoryIds);
    if (categoryIds.length !== uniqueCategoryIds.size) {
      toast.error("Você não pode ter limites duplicados para a mesma categoria.");
      return;
    }

    setIsSubmitting(true);

    try {
      const monthYear = budget?.month_year || new Date().toISOString().slice(0, 7);

      const payload = {
        monthly_limit: parseFloat(monthlyLimitNum),
        month_year: monthYear,
        is_active: true,
        category_limits: validCategoryLimits.map(cl => ({
          category_id: parseInt(cl.category_id),
          limit: parseFloat(cl.limit),
        })),
      };

      if (isEditing) {
        await axios.put(route("budgets.update", budget.id), payload);
        toast.success("Orçamento atualizado com sucesso.");
      } else {
        await axios.post(route("budgets.store"), payload);
        toast.success("Orçamento criado com sucesso.");
      }

      setMonthlyLimit('');
      setCategoryLimits([]);
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

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        return;
      }

      toast.error(isEditing ? "Erro ao atualizar orçamento." : "Erro ao criar orçamento.");
    }
  };

  const handleClose = () => {
    setMonthlyLimit('');
    setCategoryLimits([]);
    if (onClose) onClose();
  };

  const availableCategories = categories.filter(cat =>
    !categoryLimits.some(cl => cl.category_id == cat.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="3xl"
      title={isEditing ? "Editar Orçamento Mensal" : "Configurar Orçamento Mensal"}
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">💰 Sobre o orçamento mensal</p>
              <p>Defina um limite de gastos mensal e, opcionalmente, limites específicos por categoria para manter suas finanças organizadas e sob controle.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <FloatLabelField
            id="monthly_limit"
            name="monthly_limit"
            type="text"
            label="Limite mensal total"
            value={monthlyLimit}
            onChange={(e) => {
              let v = String(e.target.value || '');
              if (v.length > MAX_CHARS) v = v.slice(0, MAX_CHARS);
              setMonthlyLimit(v);
            }}
            inputProps={{
              step: '0.01',
              min: '0',
              max: String(MAX_VALUE),
              placeholder: 'R$ 0,00',
              autoComplete: 'off',
              maxLength: MAX_CHARS,
              inputMode: 'decimal',
              onPaste: (e) => {
                const paste = (e.clipboardData || window.clipboardData).getData('text') || '';
                e.preventDefault();
                const before = monthlyLimit || '';
                const combined = (before + paste).slice(0, MAX_CHARS);
                setMonthlyLimit(combined);
              }
            }}
            isRequired
          />

          {budget?.recommended_limit && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium">Recomendação baseada na sua renda</p>
                <p className="mt-1">
                  Com base no seu salário de {formatCurrency(budget.monthly_income)}, é recomendado
                  um limite de <strong>{formatCurrency(budget.recommended_limit)}</strong> (80% da sua renda),
                  reservando 20% para poupança e investimentos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Limites por Categoria
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Adicione limites específicos para controlar gastos por categoria
              </p>
            </div>
            <SecondaryButton
              type="button"
              onClick={handleAddCategoryLimit}
              className="text-sm flex-shrink-0"
              disabled={availableCategories.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </SecondaryButton>
          </div>

          {categoryLimits.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                Nenhum limite de categoria definido
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Clique em "Adicionar" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom pr-1">
              {categoryLimits.map((categoryLimit, index) => (
                <CategoryLimitRow
                  key={categoryLimit._uid}
                  index={index}
                  categoryLimit={categoryLimit}
                  categories={categories}
                  categoryLimitsAll={categoryLimits}
                  onChange={(i, field, value) => {
                    handleCategoryLimitChange(i, field, value);
                  }}
                  onRemove={(i) => handleRemoveCategoryLimit(i)}
                  max={MAX_VALUE}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <SecondaryButton type="button" onClick={handleClose} className="w-full sm:w-auto">
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Orçamento" : "Criar Orçamento"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}