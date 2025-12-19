import React, { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import FaturaForm from '@/Components/system/FaturaForm';
import BankForm from '@/Components/system/BankForm';

export default function QuickActions({ bankAccounts = [] }) {
  const [showFaturaForm, setShowFaturaForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [localBankAccounts, setLocalBankAccounts] = useState(bankAccounts);

  useEffect(() => {
    setLocalBankAccounts(bankAccounts);
  }, [bankAccounts]);

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 dark:text-gray-100">Ações rápidas</h3>

        <div className="flex flex-col gap-3">
          <PrimaryButton className="w-full" onClick={() => setShowFaturaForm(true)}>
            Nova Transação
          </PrimaryButton>
          <PrimaryButton
            className="w-full"
            style={{ background: '#3a0f0f' }}
            onClick={() => setShowBankForm(true)}
          >
            Adicionar Banco
          </PrimaryButton>
          <PrimaryButton className="w-full" style={{ background: '#222' }}>Importar CSV</PrimaryButton>
        </div>
      </div>

      <FaturaForm
        isOpen={showFaturaForm}
        onClose={() => setShowFaturaForm(false)}
        bankAccounts={localBankAccounts}
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
    </>
  );
}
