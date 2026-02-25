import React, { useEffect, useState } from 'react';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import Autocomplete from '@/Components/common/inputs/Autocomplete';
import { bankAccountService } from '@/Services/bankService';
import { toast } from 'react-toastify';

export default function BankAccountForm({ isOpen, onClose, onSuccess }) {
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadBanks = async () => {
      try {
        const data = await bankAccountService.listBanks();
        if (!cancelled) {
          setBanks(
            (data || []).map((b) => ({
              value: String(b.id),
              label: b.name,
            }))
          );
        }
      } catch {
        toast.error('Não foi possível carregar a lista de bancos.');
      }
    };

    loadBanks();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const resetForm = () => {
    setSelectedBankId('');
    setBalance('');
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!selectedBankId) {
      setErrors({ bank_id: 'Selecione um banco.' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const data = await bankAccountService.create({
        bank_id: parseInt(selectedBankId, 10),
        balance: balance ? parseFloat(balance) : 0,
      });

      onSuccess?.(data);
      resetForm();
      onClose?.();
    } catch (error) {
      const status = error.response?.status;
      const serverErrors = error.response?.data?.errors;
      const message = error.response?.data?.message;

      if (serverErrors) {
        setErrors(serverErrors);
      } else if (status === 422 && message) {
        setErrors({ general: message });
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Banco
          </label>
          <Autocomplete
            options={banks}
            value={selectedBankId}
            onChange={setSelectedBankId}
            placeholder="Pesquisar banco..."
            labelKey="label"
            valueKey="value"
            name="bank_id"
          />
          {errors.bank_id && (
            <p className="mt-1 text-xs text-red-500">
              {Array.isArray(errors.bank_id) ? errors.bank_id[0] : errors.bank_id}
            </p>
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
