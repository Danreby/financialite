import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import FaturaForm from '@/Components/system/FaturaForm';
import BankForm from '@/Components/system/BankForm';
import CategoryForm from '@/Components/system/CategoryForm';
import FaturaImportModal from '@/Components/system/fatura/import/FaturaImportModal';

export default function QuickActions({ bankAccounts = [], categories = [] }) {
  const [showFaturaForm, setShowFaturaForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
      icon: '💸',
      title: 'Nova Transação',
      description: 'Registrar receita ou despesa',
      gradient: 'from-rose-500 to-pink-600',
      hoverGradient: 'hover:from-rose-600 hover:to-pink-700',
      onClick: () => setShowFaturaForm(true),
    },
    {
      icon: '🏦',
      title: 'Adicionar Banco',
      description: 'Cadastrar nova conta',
      gradient: 'from-amber-600 to-orange-700',
      hoverGradient: 'hover:from-amber-700 hover:to-orange-800',
      onClick: () => setShowBankForm(true),
    },
    {
      icon: '🏷️',
      title: 'Adicionar Categoria',
      description: 'Criar nova categoria',
      gradient: 'from-teal-500 to-emerald-600',
      hoverGradient: 'hover:from-teal-600 hover:to-emerald-700',
      onClick: () => setShowCategoryForm(true),
    },
    {
      icon: '⏳',
      title: 'Transações Pendentes',
      description: 'Visualizar pendências',
      gradient: 'from-gray-700 to-gray-900',
      hoverGradient: 'hover:from-gray-800 hover:to-black',
      onClick: () => router.visit(route('transactions.index')),
    },
    {
      icon: '💳',
      title: 'Faturas do Cartão',
      description: 'Gerenciar faturas',
      gradient: 'from-blue-600 to-indigo-700',
      hoverGradient: 'hover:from-blue-700 hover:to-indigo-800',
      onClick: () => router.visit(route('transacoes.index')),
    },
    {
      icon: '📊',
      title: 'Importar Excel',
      description: 'Upload de faturas',
      gradient: 'from-slate-600 to-slate-800',
      hoverGradient: 'hover:from-slate-700 hover:to-slate-900',
      onClick: () => setShowImportModal(true),
    },
  ];

  return (
    <>
      <div className="rounded-2xl border dark:border-red-950/50 border-gray-50/90 bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
        <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-4 dark:text-gray-100">Ações rápidas</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} p-4 text-left shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]`}
            >
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-2xl backdrop-blur-sm">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white mb-0.5 truncate">{action.title}</h4>
                  <p className="text-[11px] text-white/80 truncate">{action.description}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      <FaturaForm
        isOpen={showFaturaForm}
        onClose={() => setShowFaturaForm(false)}
        bankAccounts={localBankAccounts}
        categories={localCategories}
      />

      <BankForm
        isOpen={showBankForm}
        onClose={() => setShowBankForm(false)}
        onSuccess={(bankUser) => {
          if (!bankUser || !bankUser.id) return;
          const name = bankUser.bank?.name || `Conta #${bankUser.id}`;
          setLocalBankAccounts((prev) => {
            if (prev.some((acc) => acc.id === bankUser.id)) {
              return prev;
            }
            return [...prev, { id: bankUser.id, name }];
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
    </>
  );
}
