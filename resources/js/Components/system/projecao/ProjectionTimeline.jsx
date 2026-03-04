import React, { useMemo } from 'react';
import ProjectionMonthBar from '@/Components/system/projecao/ProjectionMonthBar';
import { formatCurrencyBRL } from '@/Lib/formatters';

const RANGE_OPTIONS = [
    { label: '6m',  value: 6 },
    { label: '12m', value: 12 },
    { label: '24m', value: 24 },
];

export default function ProjectionTimeline({ projectionData, onChangeMonthsAhead, monthsAhead }) {
    const { months = [], highestCombinedMonth, totals = {} } = projectionData;

    const maxValue = useMemo(
        () => Math.max(...months.map((m) => m.combinedTotal), 1),
        [months],
    );

    // Always include the current billing month even when it has no transactions yet,
    // so the user can see the active open invoice when all pending ones are already paid.
    const visibleMonths = months.filter((m) => m.combinedTotal > 0 || m.isCurrentMonth);
    const hasAny        = visibleMonths.length > 0;
    const hasSimulated  = (totals.simulatedAll ?? 0) > 0;
    const hasRecurring  = months.some((m) => (m.realRecurringTotal ?? 0) > 0);

    return (
        <div className="flex flex-col gap-0">
            <div className="flex items-start justify-between gap-3 px-1 pb-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                            Projeção mês a mês
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                <span className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
                                Parcelado
                            </span>
                            {hasRecurring && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                    <span className="h-2 w-2 rounded-full bg-blue-300 dark:bg-blue-400 shrink-0" />
                                    Recorrente
                                </span>
                            )}
                            {hasSimulated && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                    <span
                                        className="h-2 w-2 rounded-full shrink-0"
                                        style={{ backgroundColor: 'var(--theme-accent)' }}
                                    />
                                    Simulado
                                </span>
                            )}
                        </div>
                    </div>
                    {highestCombinedMonth?.combinedTotal > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Pico{' '}
                            <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>
                                {formatCurrencyBRL(highestCombinedMonth.combinedTotal)}
                            </span>
                            {' '}em {highestCombinedMonth.ym}
                        </p>
                    )}
                </div>

                <div
                    className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.08] shrink-0"
                >
                    {RANGE_OPTIONS.map(({ label, value }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChangeMonthsAhead(value)}
                            className={`px-3 py-1.5 text-xs font-semibold transition ${
                                monthsAhead === value
                                    ? ''
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                            }`}
                            style={monthsAhead === value ? {
                                backgroundColor: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
                                color: 'var(--theme-accent)',
                            } : {}}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-white/[0.06] mb-1" />

            {!hasAny ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-12 w-12 text-gray-200 dark:text-gray-800"
                        aria-hidden="true"
                    >
                        <path fillRule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                            Nenhum gasto projetado
                        </p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                            Adicione parcelamentos, transações recorrentes ou simulações para visualizar
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-0 pt-1">
                    {visibleMonths.map((monthData, idx) => (
                        <ProjectionMonthBar
                            key={monthData.ym}
                            data={monthData}
                            maxValue={maxValue}
                            index={idx}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
