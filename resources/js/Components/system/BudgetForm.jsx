import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import { Plus, Trash2, AlertCircle } from "lucide-react";

export default function BudgetForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  categories = [],
  budget = null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (budget?.category_limits) {
        setCategoryLimits(
          budget.category_limits.map(cl => ({
            category_id: cl.category_id,
            limit: cl.limit
          }))
        );
      } else {
        setCategoryLimits([]);
      }
    }
  }, [budget, isOpen]);

  const handleAddCategoryLimit = () => {
    setCategoryLimits([...categoryLimits, { category_id: '', limit: '' }]);
  };

  const handleRemoveCategoryLimit = (index) => {
    const newLimits = categoryLimits.filter((_, i) => i !== index);
    setCategoryLimits(newLimits);
  };

  const handleCategoryLimitChange = (index, field, value) => {
    const newLimits = [...categoryLimits];
    newLimits[index][field] = value;
    setCategoryLimits(newLimits);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const monthlyLimit = formData.get("monthly_limit")?.toString().trim();

    toast.dismiss();

    if (!monthlyLimit || parseFloat(monthlyLimit) < 0) {
      toast.error("Informe um limite mensal válido.");
      return;
    }

    const validCategoryLimits = categoryLimits.filter(cl => {
      return cl.category_id && cl.limit && parseFloat(cl.limit) >= 0;
    });

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
        monthly_limit: parseFloat(monthlyLimit),
        month_year: monthYear,
        is_active: true,
        category_limits: validCategoryLimits.map(cl => ({
          category_id: parseInt(cl.category_id),
          limit: parseFloat(cl.limit),
        })),
      };

      if (budget) {
        await axios.put(route("budgets.update", budget.id), payload);
        toast.success("Orçamento atualizado com sucesso.");
      } else {
        await axios.post(route("budgets.store"), payload);
        toast.success("Orçamento criado com sucesso.");
      }

      form.reset();
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

      toast.error(budget ? "Erro ao atualizar orçamento." : "Erro ao criar orçamento.");
    }
  };

  const handleClose = () => {
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
      title={budget ? "Editar Orçamento Mensal" : "Configurar Orçamento Mensal"}
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

        {/* Monthly Limit Field */}
        <div className="space-y-4">
          <FloatLabelField
            key={`monthly_limit-${budget?.id || 'new'}`}
            id="monthly_limit"
            name="monthly_limit"
            type="number"
            label="Limite mensal total"
            defaultValue={budget?.monthly_limit}
            inputProps={{
              step: '0.01',
              min: '0',
              placeholder: 'R$ 0,00',
              autoComplete: 'off'
            }}
            isRequired
          />
        </div>

        {/* Category Limits Section */}
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
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {categoryLimits.map((categoryLimit, index) => (
                <div 
                  key={`category-limit-${index}`}
                  className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg items-start sm:items-center"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 sm:hidden">
                      Categoria
                    </label>
                    <select
                      value={categoryLimit.category_id}
                      onChange={(e) => handleCategoryLimitChange(index, 'category_id', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories
                        .filter(cat => 
                          !categoryLimits.some((cl, i) => i !== index && cl.category_id == cat.id)
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
                      type="number"
                      value={categoryLimit.limit}
                      onChange={(e) => handleCategoryLimitChange(index, 'limit', e.target.value)}
                      placeholder="R$ 0,00"
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryLimit(index)}
                    className="w-full sm:w-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2 sm:gap-0"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-sm sm:hidden">Remover</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <SecondaryButton type="button" onClick={handleClose} className="w-full sm:w-auto">
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Salvando..." : budget ? "Atualizar Orçamento" : "Criar Orçamento"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
