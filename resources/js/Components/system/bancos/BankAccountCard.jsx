import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, Receipt, SlidersHorizontal, Pencil, Trash2, TrendingUp } from 'lucide-react';
import Sparkline from '@/Components/common/Sparkline';
import { formatCurrencyBRL } from '@/Lib/formatters';

const BankAccountCard = React.forwardRef(function BankAccountCard(
  { account, onEdit, onDelete, onAdjust, onStatement, saving },
  ref
) {
  const balance = parseFloat(account.balance ?? 0);
  const trend = Array.isArray(account.trend) ? account.trend : [];
  const accountName = account.bank?.name || account.name || `Conta #${account.id}`;

  const balanceColor =
    balance > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : balance < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400';

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl p-4 sm:p-5 themed-card themed-card-hover"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="themed-icon-box h-10 w-10 flex-shrink-0">
            <Landmark className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {accountName}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Conta corrente</p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => onStatement(account)}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors"
            aria-label="Ver extrato"
            title="Extrato da conta"
          >
            <Receipt className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onAdjust(account)}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            aria-label="Ajustar saldo"
            title="Adicionar ou subtrair valor"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(account)}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors"
            aria-label="Editar conta"
            title="Editar saldo"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onDelete({ bankUserId: account.id, name: accountName })}
            disabled={saving}
            className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Remover conta"
            title="Remover conta"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <p className={`text-2xl font-bold tabular-nums leading-none ${balanceColor}`}>
        {formatCurrencyBRL(balance)}
      </p>

      <div className="mt-3 -mx-1">
        <Sparkline data={trend} />
      </div>

      {account.income_count > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <TrendingUp className="h-3 w-3 text-emerald-500 flex-shrink-0" strokeWidth={2} />
          <span>
            {account.income_count} {account.income_count === 1 ? 'receita vinculada' : 'receitas vinculadas'}
            {account.income_total ? ` · ${formatCurrencyBRL(account.income_total)}/mês` : ''}
          </span>
        </div>
      )}
    </motion.div>
  );
});

export default BankAccountCard;
