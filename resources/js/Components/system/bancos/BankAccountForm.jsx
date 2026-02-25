import React, { useState } from 'react';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';

export default function BankAccountForm({ isOpen, onClose, onSuccess, existingAccounts = [] }) {
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setBankName('');
    setBalance('');
    setErrors({});
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const name = bankName.trim();
    if (!name) {
      setErrors({ bank_name: 'Informe o nome do banco.' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.create({
        bank_name: name,
        balance: balance ? parseFloat(balance) : 0,
      });

      onSuccess?.(data);
      resetForm();
      onClose?.();
    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: 'Não foi possível criar a conta bancária.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Conta Bancária" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Banco
          </label>
          <input
            id="bank_name"
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ex: Nubank, Itaú, Bradesco..."
            maxLength={255}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
            autoFocus
          />
          {errors.bank_name && (
            <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.bank_name) ? errors.bank_name[0] : errors.bank_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Saldo Inicial
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
            <input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          {errors.balance && (
            <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.balance) ? errors.balance[0] : errors.balance}</p>
          )}
        </div>

        {errors.general && (
          <p className="text-xs text-red-500 text-center">{errors.general}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <PrimaryButton type="submit" disabled={saving} className="rounded-xl px-5 py-2 text-sm font-medium">
            {saving ? 'Salvando...' : 'Criar Conta'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
