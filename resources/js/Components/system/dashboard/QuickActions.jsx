import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
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
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLocalBankAccounts(bankAccounts);
  }, [bankAccounts]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const actions = [
    {
      icon: '💸',
      title: 'Nova Despesa',
      description: 'Registrar despesa',
      useThemeColors: true,
      onClick: () => setShowExpenseForm(true),
    },
        {
      icon: '💰',
      title: 'Nova Entrada',
      description: 'Registrar entrada',
      useThemeColors: true,
      onClick: () => setShowIncomeForm(true),
    },
    {
      icon: '🏦',
      title: 'Adicionar Cartão',
      description: 'Cadastrar novo cartão',
      useThemeColors: true,
      onClick: () => setShowCardForm(true),
    },
    {
      icon: '🏷️',
      title: 'Adicionar Categoria',
      description: 'Criar nova categoria',
      useThemeColors: true,
      onClick: () => setShowCategoryForm(true),
    },
    {
      icon: '💳',
      title: 'Faturas do Cartão',
      description: 'Gerenciar faturas',
      useThemeColors: true,
      onClick: () => router.visit(route('transacoes.index')),
    },
    {
      icon: '📊',
      title: 'Importar Excel',
      description: 'Upload de faturas',
      useThemeColors: true,
      onClick: () => setShowImportModal(true),
    },
  ];

  return (
    <>
      <div className="rounded-2xl themed-card p-4">
        <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-4 dark:text-gray-100">Ações rápidas</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto scrollbar-custom pr-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`group relative overflow-hidden rounded-xl p-4 text-left shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] ${
                action.useThemeColors ? 'themed-button-primary' : ''
              }`}
              style={action.useThemeColors ? {} : {
                backgroundColor: isDark ? action.bgColorDark : action.bgColorLight,
              }}
            >
              <div className="relative z-10 flex items-start gap-3">
                <div 
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-2xl backdrop-blur-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 
                    className="text-sm font-bold mb-0.5 truncate"
                    style={{ color: isDark ? '#ffffff' : '#000000' }}
                  >
                    {action.title}
                  </h4>
                  <p 
                    className="text-[11px] truncate"
                    style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)' }}
                  >
                    {action.description}
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </button>
          ))}
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
