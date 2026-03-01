import React from 'react';
import { formatCurrencyBRL } from '@/Lib/formatters';

function parseYM(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '');
}

export default function SimulationItem({ simulation, onRemove }) {
    const {
        id, title, amount, installments, installmentAmount,
        type, bankName, categoryName, categoryColor, startMonth,
    } = simulation;

    const isCredit = type === 'credit';

    const endMonth = (() => {
        const [y, m] = startMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + (installments - 1), 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    return (
        <div className="themed-card rounded-xl flex items-stretch gap-0 overflow-hidden">
            <div
                className="w-1 shrink-0"
                style={{
                    backgroundColor: isCredit
                        ? 'var(--theme-accent)'
                        : 'rgba(249,115,22,0.7)',
                }}
            />

            <div className="flex flex-1 items-start justify-between gap-2 px-3 py-2.5 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {title}
                        </span>
                        <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={isCredit ? {
                                backgroundColor: 'color-mix(in srgb, var(--theme-accent) 13%, transparent)',
                                color: 'var(--theme-accent)',
                            } : {
                                backgroundColor: 'rgba(249,115,22,0.13)',
                                color: 'rgba(234,88,12,1)',
                            }}
                        >
                            {isCredit ? 'Crédito' : 'Débito'}
                        </span>
                        {categoryName && (
                            <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                    backgroundColor: categoryColor ? `${categoryColor}22` : 'rgba(148,163,184,0.15)',
                                    color: categoryColor ?? 'rgb(100,116,139)',
                                }}
                            >
                                {categoryName}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {formatCurrencyBRL(amount)}
                        </span>
                        {installments > 1 && (
                            <span className="text-gray-400 dark:text-gray-500">
                                {installments}× {formatCurrencyBRL(installmentAmount)}
                            </span>
                        )}
                        <span className="text-gray-400 dark:text-gray-500">
                            {parseYM(startMonth)}
                            {installments > 1 ? ` → ${parseYM(endMonth)}` : ''}
                        </span>
                        {bankName && (
                            <span className="text-gray-400 dark:text-gray-500">{bankName}</span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(id)}
                    className="shrink-0 mt-0.5 rounded-lg p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.12] transition"
                    aria-label={`Remover ${title}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                    >
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
