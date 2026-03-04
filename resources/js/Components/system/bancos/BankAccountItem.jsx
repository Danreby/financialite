import React from 'react';
import { motion } from 'framer-motion';
import BareButton from '@/Components/common/buttons/BareButton';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export default function BankAccountItem({ account, onEdit, onDelete, onAdjust, saving }) {
  const balance = parseFloat(account.balance ?? 0);
  const balanceColor =
    balance > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : balance < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-gray-800"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
          <span className="text-lg">🏦</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {account.bank?.name || account.name || `Conta #${account.id}`}
          </p>
          <p className={`text-xs font-medium ${balanceColor}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <BareButton
          type="button"
          onClick={() => onAdjust(account)}
          disabled={saving}
          className="rounded-lg p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          aria-label="Ajustar saldo"
          title="Adicionar ou subtrair valor"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </BareButton>
        <BareButton
          type="button"
          onClick={() => onEdit(account)}
          disabled={saving}
          className="rounded-lg p-1.5 text-gray-400 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors"
          aria-label="Editar conta"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </BareButton>
        <BareButton
          type="button"
          onClick={() => onDelete({ bankUserId: account.id, name: account.bank?.name || account.name })}
          disabled={saving}
          className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Remover conta"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </BareButton>
      </div>
    </motion.div>
  );
}
