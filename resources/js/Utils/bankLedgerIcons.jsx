import React from 'react';
import { Flag, SlidersHorizontal, ArrowDownToLine, Receipt, ShoppingCart, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

export const LEDGER_TYPE_ICONS = {
  account_opening: Flag,
  manual_adjustment: SlidersHorizontal,
  income_credit: ArrowDownToLine,
  invoice_payment: Receipt,
  debit_purchase: ShoppingCart,
  transfer_out: ArrowUpRight,
  transfer_in: ArrowDownLeft,
};

export function LedgerTypeIcon({ type, className = 'h-4 w-4' }) {
  const Icon = LEDGER_TYPE_ICONS[type] || Wallet;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
