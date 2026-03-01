import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrencyBRL } from '@/Lib/formatters';

function formatYM(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    return label.replace('.', '');
}

export default function ProjectionMonthBar({ data, maxValue, index = 0 }) {
    const [expanded, setExpanded] = useState(false);

    const {
        ym,
        isCurrentMonth,
        realInstallmentTotal,
        realRecurringCreditTotal,
        realRecurringDebitTotal,
        realCreditTotal,
        realDebitTotal,
        simulatedCreditTotal,
        simulatedDebitTotal,
        realTotal,
        simulatedTotal,
        combinedTotal,
        simulationBreakdown,
        recurringBreakdown = [],
    } = data;

    const safeMax      = maxValue > 0 ? maxValue : 1;
    const combinedPct  = Math.min((combinedTotal / safeMax) * 100, 100);
    const realRatio    = combinedTotal > 0 ? (realTotal / combinedTotal) * 100 : 0;
    const simulRatio   = combinedTotal > 0 ? (simulatedTotal / combinedTotal) * 100 : 0;
    const hasSimulated = simulatedTotal > 0;
    const hasBreakdown = simulationBreakdown.length > 0 || recurringBreakdown.length > 0;
    const hasSubInfo   = realInstallmentTotal > 0 || realRecurringCreditTotal > 0 || realRecurringDebitTotal > 0 || simulatedCreditTotal > 0 || simulatedDebitTotal > 0;

    return (
        <div className="group">
            <button
                type="button"
                onClick={() => hasBreakdown && setExpanded((p) => !p)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                    hasBreakdown ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03]' : 'cursor-default'
                }`}
                style={isCurrentMonth ? {
                    backgroundColor: 'color-mix(in srgb, var(--theme-accent) 9%, transparent)',
                } : {}}
                aria-expanded={hasBreakdown ? expanded : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className="w-[52px] shrink-0 flex items-center gap-1">
                        {isCurrentMonth && (
                            <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: 'var(--theme-accent)' }}
                            />
                        )}
                        <span
                            className={`text-[11px] font-semibold uppercase tracking-wide ${
                                isCurrentMonth
                                    ? 'font-bold'
                                    : 'text-gray-400 dark:text-gray-500'
                            }`}
                            style={isCurrentMonth ? { color: 'var(--theme-accent)' } : {}}
                        >
                            {formatYM(ym)}
                        </span>
                    </div>

                    <div className="flex-1 relative h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                        <motion.div
                            className="absolute left-0 top-0 h-full rounded-full flex overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${combinedPct}%` }}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: index * 0.025 }}
                        >
                            {realRatio > 0 && (
                                <div
                                    className="h-full shrink-0"
                                    style={{
                                        width: `${realRatio}%`,
                                        backgroundColor: 'rgba(96,165,250,0.8)',
                                    }}
                                />
                            )}
                            {simulRatio > 0 && (
                                <div
                                    className="h-full shrink-0"
                                    style={{
                                        width: `${simulRatio}%`,
                                        backgroundColor: 'var(--theme-accent)',
                                    }}
                                />
                            )}
                        </motion.div>
                    </div>

                    <div className="w-[90px] shrink-0 flex flex-col items-end">
                        <span
                            className="text-xs font-bold"
                            style={hasSimulated ? { color: 'var(--theme-accent)' } : {}}
                        >
                            <span className={!hasSimulated ? 'text-gray-700 dark:text-gray-200' : ''}>
                                {formatCurrencyBRL(combinedTotal)}
                            </span>
                        </span>
                        {hasSimulated && realTotal > 0 && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">
                                {formatCurrencyBRL(realTotal)}
                            </span>
                        )}
                    </div>

                    {hasBreakdown ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className={`h-3 w-3 shrink-0 transition-transform text-gray-300 dark:text-gray-600 ${
                                expanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                        >
                            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                        </svg>
                    ) : (
                        <div className="h-3 w-3 shrink-0" />
                    )}
                </div>

                {hasSubInfo && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 pl-[68px] text-[10px] text-gray-400 dark:text-gray-600">
                        {realInstallmentTotal > 0 && <span>💳 {formatCurrencyBRL(realInstallmentTotal)}</span>}
                        {realRecurringCreditTotal > 0 && <span>🔁 cred {formatCurrencyBRL(realRecurringCreditTotal)}</span>}
                        {realRecurringDebitTotal > 0 && <span>🔁 déb {formatCurrencyBRL(realRecurringDebitTotal)}</span>}
                        {simulatedCreditTotal > 0 && (
                            <span style={{ color: 'var(--theme-accent)' }}>+cred {formatCurrencyBRL(simulatedCreditTotal)}</span>
                        )}
                        {simulatedDebitTotal > 0 && (
                            <span style={{ color: 'var(--theme-accent)' }}>+déb {formatCurrencyBRL(simulatedDebitTotal)}</span>
                        )}
                    </div>
                )}
            </button>

            <AnimatePresence initial={false}>
                {expanded && hasBreakdown && (
                    <motion.div
                        key="bd"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mx-3 mb-2 rounded-lg border border-gray-100 dark:border-white/[0.06] px-3 py-2 flex flex-col gap-1.5">
                            {recurringBreakdown.length > 0 && (
                                <>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600 font-semibold">
                                        Recorrentes neste mês
                                    </span>
                                    {recurringBreakdown.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 truncate">
                                                <span>🔁</span>
                                                {item.title}
                                            </span>
                                            <span className="shrink-0 text-xs font-semibold ml-3 text-blue-500 dark:text-blue-400">
                                                {formatCurrencyBRL(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                            {simulationBreakdown.length > 0 && (
                                <>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600 font-semibold mt-1">
                                        Itens simulados neste mês
                                    </span>
                                    {simulationBreakdown.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{item.title}</span>
                                            <span
                                                className="shrink-0 text-xs font-semibold ml-3"
                                                style={{ color: 'var(--theme-accent)' }}
                                            >
                                                {formatCurrencyBRL(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
