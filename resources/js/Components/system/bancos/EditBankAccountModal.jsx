import React, { useState } from 'react';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export default function EditBankAccountModal({ isOpen, onClose, account, onSuccess, saving: externalSaving }) {
  const [balance, setBalance] = useState('');
  const [internalSaving, setInternalSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const saving = externalSaving || internalSaving;

  React.useEffect(() => {
    if (account && isOpen) {
      setBalance(account.balance != null ? String(account.balance) : '');
      setErrors({});
    }
  }, [account, isOpen]);

  const handleClose = () => {
    if (saving) return;
    setErrors({});
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || saving) return;

    setInternalSaving(true);
    setErrors({});

    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.update(account.id, {
        balance: balance ? parseFloat(balance) : 0,
      });

      onSuccess?.(data);
      onClose?.();
    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: 'Não foi possível atualizar a conta.' });
      }
    } finally {
      setInternalSaving(false);
    }
  };

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Conta Bancária" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
            <span className="text-lg">🏦</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {account.bank?.name || account.name || `Conta #${account.id}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Saldo atual: {formatCurrency(account.balance)}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="edit_balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Novo Saldo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
            <input
              id="edit_balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
              autoFocus
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
            {saving ? 'Salvando...' : 'Atualizar Saldo'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
