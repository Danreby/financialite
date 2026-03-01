import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrencyBRL } from '@/Lib/formatters';

function formatYM(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export default function ProjectionMonthBar({
    data,
    maxValue,
    isFirst = false,
}) {
    const [expanded, setExpanded] = useState(false);

    const {
        ym,
        isCurrentMonth,
        realCreditTotal,
        realDebitTotal,
        simulatedCreditTotal,
        simulatedDebitTotal,
        realTotal,
        simulatedTotal,
        combinedTotal,
        simulationBreakdown,
    } = data;

    const safeMax     = maxValue > 0 ? maxValue : 1;
    const realPct     = Math.min((realTotal / safeMax) * 100, 100);
    const simulPct    = Math.min((simulatedTotal / safeMax) * 100, 100);
    const hasSimulated = simulatedTotal > 0;
    const hasBreakdown = simulationBreakdown.length > 0;

    return (
        <div
            className={`rounded-xl border transition ${
                isCurrentMonth
                    ? 'border-theme-accent/40 bg-theme-accent/5'
                    : 'border-gray-100 dark:border-white/8 bg-white dark:bg-white/3'
            } shadow-sm overflow-hidden`}
        >
            <button
                type="button"
                onClick={() => hasBreakdown && setExpanded((p) => !p)}
                className={`w-full text-left px-3 py-2.5 ${hasBreakdown ? 'cursor-pointer' : 'cursor-default'}`}
                aria-expanded={hasBreakdown ? expanded : undefined}
            >
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                            {formatYM(ym)}
                        </span>
                        {isCurrentMonth && (
                            <span className="rounded-full text-theme-accent bg-theme-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                Atual
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-right">
                        {hasSimulated && (
                            <div>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 block leading-none mb-0.5">
                                    atual
                                </span>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {formatCurrencyBRL(realTotal)}
                                </span>
                            </div>
                        )}
                        <div>
                            {hasSimulated && (
                                <span className="text-[10px] text-theme-accent block leading-none mb-0.5 font-semibold">
                                    c/ simulação
                                </span>
                            )}
                            <span className={`text-sm font-bold ${hasSimulated ? 'text-theme-accent' : 'text-gray-800 dark:text-gray-100'}`}>
                                {formatCurrencyBRL(combinedTotal)}
                            </span>
                        </div>

                        {hasBreakdown && (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                            >
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-white/8">
                    {realTotal > 0 && (
                        <motion.div
                            initial={isFirst ? false : { width: 0 }}
                            animate={{ width: `${realPct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full bg-blue-400 dark:bg-blue-500 shrink-0"
                        />
                    )}
                    {simulatedTotal > 0 && (
                        <motion.div
                            initial={isFirst ? false : { width: 0 }}
                            animate={{ width: `${simulPct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                            className="h-full rounded-full bg-theme-accent shrink-0"
                        />
                    )}
                </div>

                {(realCreditTotal > 0 || realDebitTotal > 0 || simulatedCreditTotal > 0 || simulatedDebitTotal > 0) && (
                    <div className="flex flex-wrap gap-x-3 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                        {realCreditTotal > 0 && (
                            <span>💳 {formatCurrencyBRL(realCreditTotal)}</span>
                        )}
                        {realDebitTotal > 0 && (
                            <span>🏦 {formatCurrencyBRL(realDebitTotal)}</span>
                        )}
                        {simulatedCreditTotal > 0 && (
                            <span className="text-theme-accent">+crédito {formatCurrencyBRL(simulatedCreditTotal)}</span>
                        )}
                        {simulatedDebitTotal > 0 && (
                            <span className="text-theme-accent">+débito {formatCurrencyBRL(simulatedDebitTotal)}</span>
                        )}
                    </div>
                )}
            </button>

            <AnimatePresence initial={false}>
                {expanded && hasBreakdown && (
                    <motion.div
                        key="breakdown"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-gray-100 dark:border-white/8 px-3 pb-2.5 pt-2 flex flex-col gap-1">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-semibold mb-1">
                                Simulações neste mês
                            </p>
                            {simulationBreakdown.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-300 truncate">{item.title}</span>
                                    <span className="shrink-0 font-medium text-theme-accent ml-2">
                                        {formatCurrencyBRL(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
