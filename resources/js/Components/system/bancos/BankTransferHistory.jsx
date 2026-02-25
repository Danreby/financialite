import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function BankTransferHistory({ transfers = [] }) {
  if (transfers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 sm:p-5 shadow-md themed-card"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
          <span className="text-base">📋</span>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Histórico de Transferências
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {transfers.length} {transfers.length === 1 ? 'transferência' : 'transferências'} realizadas
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-custom">
        <AnimatePresence mode="popLayout">
          {transfers.map((transfer) => (
            <TransferItem key={transfer.id} transfer={transfer} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TransferItem({ transfer }) {
  const fromName = transfer.from_bank_user?.bank?.name || `Conta #${transfer.from_bank_user_id}`;
  const toName = transfer.to_bank_user?.bank?.name || `Conta #${transfer.to_bank_user_id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{fromName}</span>
          <svg className="h-3 w-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{toName}</span>
        </div>
        {transfer.description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{transfer.description}</p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(transfer.amount)}
        </p>
        {transfer.created_at && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(transfer.created_at)}</p>
        )}
      </div>
    </motion.div>
  );
}
