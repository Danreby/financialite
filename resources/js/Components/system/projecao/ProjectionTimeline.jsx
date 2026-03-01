import React, { useState, useMemo } from 'react';
import ProjectionMonthBar from '@/Components/system/projecao/ProjectionMonthBar';
import { formatCurrencyBRL } from '@/Lib/formatters';

const RANGE_OPTIONS = [
    { label: '6 meses',  value: 6 },
    { label: '12 meses', value: 12 },
    { label: '24 meses', value: 24 },
];

export default function ProjectionTimeline({ projectionData, onChangeMonthsAhead, monthsAhead }) {
    const { months = [], highestCombinedMonth } = projectionData;

    const maxValue = useMemo(
        () => Math.max(...months.map((m) => m.combinedTotal), 1),
        [months],
    );

    const nonZeroMonths = months.filter((m) => m.combinedTotal > 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Projeção mês a mês
                    </h2>
                    {highestCombinedMonth?.combinedTotal > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Pico:{' '}
                            <span className="font-medium text-theme-accent">
                                {formatCurrencyBRL(highestCombinedMonth.combinedTotal)}
                            </span>{' '}
                            em {highestCombinedMonth.ym}
                        </p>
                    )}
                </div>

                <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                    {RANGE_OPTIONS.map(({ label, value }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChangeMonthsAhead(value)}
                            className={`px-3 py-1.5 text-xs font-medium transition ${
                                monthsAhead === value
                                    ? 'themed-selected'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400">Atual</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-theme-accent shrink-0" />
                    <span className="text-gray-500 dark:text-gray-400">Simulado</span>
                </div>
            </div>

            {nonZeroMonths.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-3"
                        aria-hidden="true"
                    >
                        <path fillRule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Nenhum gasto projetado para o período
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Adicione parcelamentos simulados para visualizar
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {months.map((monthData, idx) => (
                        monthData.combinedTotal > 0 && (
                            <ProjectionMonthBar
                                key={monthData.ym}
                                data={monthData}
                                maxValue={maxValue}
                                isFirst={idx === 0}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
