import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export default function BankTransferForm({ accounts = [], onSuccess }) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const availableDestinations = accounts.filter((a) => String(a.id) !== String(fromId));

  const resetForm = () => {
    setFromId('');
    setToId('');
    setAmount('');
    setDescription('');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!fromId || !toId) {
      setErrors({ general: 'Selecione a conta de origem e destino.' });
      return;
    }
    if (fromId === toId) {
      setErrors({ general: 'As contas de origem e destino devem ser diferentes.' });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setErrors({ amount: 'Informe um valor válido.' });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const { bankTransferService } = await import('@/Services/bankService');
      const data = await bankTransferService.create({
        from_bank_user_id: parseInt(fromId, 10),
        to_bank_user_id: parseInt(toId, 10),
        amount: parseFloat(amount),
        description: description.trim() || null,
      });

      onSuccess?.(data);
      resetForm();
    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Não foi possível realizar a transferência.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const getAccountName = (acc) => acc.bank?.name || acc.name || `Conta #${acc.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 sm:p-5 shadow-md themed-card"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
          <span className="text-base">🔄</span>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Transferência entre Contas
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            Mova dinheiro entre suas contas bancárias
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="transfer_from" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Conta de Origem
            </label>
            <select
              id="transfer_from"
              value={fromId}
              onChange={(e) => {
                setFromId(e.target.value);
                if (e.target.value === toId) setToId('');
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
            >
              <option value="">Selecione...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {errors.from_bank_user_id && (
              <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.from_bank_user_id) ? errors.from_bank_user_id[0] : errors.from_bank_user_id}</p>
            )}
          </div>

          <div>
            <label htmlFor="transfer_to" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Conta de Destino
            </label>
            <select
              id="transfer_to"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
            >
              <option value="">Selecione...</option>
              {availableDestinations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getAccountName(acc)} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {errors.to_bank_user_id && (
              <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.to_bank_user_id) ? errors.to_bank_user_id[0] : errors.to_bank_user_id}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="transfer_amount" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
              <input
                id="transfer_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.amount) ? errors.amount[0] : errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="transfer_description" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Descrição <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="transfer_description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Transferência mensal..."
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{Array.isArray(errors.description) ? errors.description[0] : errors.description}</p>
            )}
          </div>
        </div>

        {errors.general && (
          <p className="text-xs text-red-500 text-center">{errors.general}</p>
        )}

        <div className="flex justify-end pt-1">
          <PrimaryButton type="submit" disabled={saving || accounts.length < 2} className="rounded-xl px-5 py-2 text-sm font-medium">
            {saving ? 'Transferindo...' : '🔄 Transferir'}
          </PrimaryButton>
        </div>
      </form>
    </motion.div>
  );
}
