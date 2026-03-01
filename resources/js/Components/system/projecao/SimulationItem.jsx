import React from 'react';
import { formatCurrencyBRL } from '@/Lib/formatters';

function parseYM(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export default function SimulationItem({ simulation, onRemove }) {
    const {
        id, title, amount, installments, installmentAmount,
        type, bankName, categoryName, categoryColor, startMonth,
    } = simulation;

    const endMonth = (() => {
        const [y, m] = startMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + (installments - 1), 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 dark:border-white/8 bg-white dark:bg-white/3 px-3 py-2.5 shadow-sm">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {title}
                    </span>
                    <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            type === 'credit'
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                                : 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'
                        }`}
                    >
                        {type === 'credit' ? 'Crédito' : 'Débito'}
                    </span>
                    {categoryName && (
                        <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                                backgroundColor: categoryColor ? `${categoryColor}20` : undefined,
                                color: categoryColor ?? undefined,
                            }}
                        >
                            {categoryName}
                        </span>
                    )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {formatCurrencyBRL(amount)}
                    </span>
                    {installments > 1 && (
                        <span>
                            {installments}× {formatCurrencyBRL(installmentAmount)}
                        </span>
                    )}
                    <span>
                        {parseYM(startMonth)}
                        {installments > 1 ? ` → ${parseYM(endMonth)}` : ''}
                    </span>
                    {bankName && <span>{bankName}</span>}
                </div>
            </div>

            <button
                type="button"
                onClick={() => onRemove(id)}
                className="shrink-0 mt-0.5 rounded-lg p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition"
                aria-label={`Remover ${title}`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                >
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
            </button>
        </div>
    );
}
