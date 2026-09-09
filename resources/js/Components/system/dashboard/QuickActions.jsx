import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { Wallet, TrendingUp, CreditCard, Tag, CalendarRange, FileSpreadsheet } from 'lucide-react';
import ExpenseForm from '@/Components/system/ExpenseForm';
import CardForm from '@/Components/system/CardForm';
import CategoryForm from '@/Components/system/CategoryForm';
import FaturaImportModal from '@/Components/system/fatura/import/FaturaImportModal';
import QuickIncomeForm from '@/Components/system/income/QuickIncomeForm';

export default function QuickActions({ bankAccounts = [], bankAccountsList = [], categories = [], onTransactionCreated }) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [localBankAccounts, setLocalBankAccounts] = useState(bankAccounts);
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    setLocalBankAccounts(bankAccounts);
  }, [bankAccounts]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const actions = [
    {
      icon: Wallet,
      title: 'Nova Despesa',
      description: 'Registrar despesa',
      onClick: () => setShowExpenseForm(true),
    },
    {
      icon: TrendingUp,
      title: 'Nova Entrada',
      description: 'Registrar entrada',
      onClick: () => setShowIncomeForm(true),
    },
    {
      icon: CreditCard,
      title: 'Adicionar Cartão',
      description: 'Cadastrar novo cartão',
      onClick: () => setShowCardForm(true),
    },
    {
      icon: Tag,
      title: 'Adicionar Categoria',
      description: 'Criar nova categoria',
      onClick: () => setShowCategoryForm(true),
    },
    {
      icon: CalendarRange,
      title: 'Resumo Mensal',
      description: 'Visão geral do mês',
      onClick: () => router.visit(route('resumo-mensal.index')),
    },
    {
      icon: FileSpreadsheet,
      title: 'Importar Excel',
      description: 'Upload de faturas',
      onClick: () => setShowImportModal(true),
    },
  ];

  return (
    <>
      <div className="rounded-2xl themed-card p-4">
        <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-4 dark:text-gray-100">Ações rápidas</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto scrollbar-custom pr-1">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.title}
                type="button"
                onClick={action.onClick}
                className="group relative flex items-start gap-3 overflow-hidden rounded-xl border-2 border-theme-primary bg-transparent p-4 text-left transition-colors duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-accent dark:border-theme-accent dark:focus-visible:ring-offset-[#0b0b0b] active:border-theme-accent-hover dark:active:border-theme-accent-hover"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-1/2 h-40 w-40 -translate-x-[142px] -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--theme-primary)_45%,transparent)] transition-[transform,background-color] duration-500 group-hover:-translate-x-[18px] group-active:bg-[color-mix(in_srgb,var(--theme-accentHover)_75%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_45%,transparent)] dark:group-active:bg-[color-mix(in_srgb,var(--theme-accentHover)_75%,transparent)]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-1/2 h-40 w-40 translate-x-[142px] -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--theme-primary)_45%,transparent)] transition-[transform,background-color] duration-500 group-hover:translate-x-[18px] group-active:bg-[color-mix(in_srgb,var(--theme-accentHover)_75%,transparent)] dark:bg-[color-mix(in_srgb,var(--theme-accent)_45%,transparent)] dark:group-active:bg-[color-mix(in_srgb,var(--theme-accentHover)_75%,transparent)]"
                />

                <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-theme-accent-light transition-colors duration-300 group-hover:bg-white/20 dark:bg-theme-accent/20 dark:group-hover:bg-white/20">
                  <Icon className="h-5 w-5 text-theme-primary transition-colors duration-300 group-hover:text-white dark:text-theme-accent dark:group-hover:text-white" aria-hidden="true" />
                </div>
                <div className="relative z-10 min-w-0 flex-1">
                  <h4 className="mb-0.5 truncate text-sm font-bold text-gray-900 transition-colors duration-300 group-hover:text-white dark:text-gray-100 dark:group-hover:text-white">
                    {action.title}
                  </h4>
                  <p className="truncate text-[11px] text-gray-500 transition-colors duration-300 group-hover:text-white/80 dark:text-gray-400 dark:group-hover:text-white/80">
                    {action.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        bankAccounts={localBankAccounts}
        debitAccounts={bankAccountsList}
        categories={localCategories}
        onSuccess={() => {
          setShowExpenseForm(false);
          if (onTransactionCreated) onTransactionCreated();
        }}
      />

      <CardForm
        isOpen={showCardForm}
        onClose={() => setShowCardForm(false)}
        onSuccess={(cardUser) => {
          if (!cardUser || !cardUser.id) return;
          const name = cardUser.card?.name || `Cartão #${cardUser.id}`;
          setLocalBankAccounts((prev) => {
            if (prev.some((acc) => acc.id === cardUser.id)) {
              return prev;
            }
            return [...prev, { id: cardUser.id, name }];
          });
        }}
      />

      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        categories={localCategories}
        onSuccess={(category) => {
          if (!category || !category.id) return;
          if (!category.name) return;

          setLocalCategories((prev) => {
            if (prev.some((c) => c.id === category.id)) {
              return prev;
            }
            return [...prev, { id: category.id, name: category.name }];
          });
        }}
      />

      <FaturaImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          //
        }}
      />

      <QuickIncomeForm
        isOpen={showIncomeForm}
        onClose={() => setShowIncomeForm(false)}
        bankAccountsList={bankAccountsList}
        onSuccess={() => {
          setShowIncomeForm(false);
          toast.success('Entrada cadastrada com sucesso!');
          if (onTransactionCreated) onTransactionCreated();
        }}
      />
    </>
  );
}
