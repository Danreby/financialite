import React, { useState, useCallback, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import SimulationPanel from '@/Components/system/projecao/SimulationPanel';
import SimulationItem from '@/Components/system/projecao/SimulationItem';
import ProjectionTimeline from '@/Components/system/projecao/ProjectionTimeline';
import { useProjectionEngine } from '@/Hooks/useProjectionEngine';
import { formatCurrencyBRL } from '@/Lib/formatters';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'projecao_simulations';

function StatCard({ label, value, sub, accent = false }) {
    return (
        <div className={`rounded-2xl themed-card p-3 lg:p-4 flex flex-col gap-1 ${accent ? 'border border-theme-accent/30' : ''}`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`text-lg lg:text-xl font-bold mt-0.5 ${accent ? 'text-theme-accent' : 'text-gray-900 dark:text-gray-100'}`}>
                {value}
            </span>
            {sub && <span className="text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
        </div>
    );
}

function clearStoredSimulations() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

function loadStoredSimulations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveSimulations(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* noop */ }
}

export default function Projecao({
    installments     = [],
    bankAccounts     = [],
    categories       = [],
    currentMonthStats = { credit: 0, debit: 0, month: '' },
}) {
    const [simulations, setSimulations]   = useState(() => loadStoredSimulations());
    const [monthsAhead, setMonthsAhead]   = useState(12);
    const [showForm, setShowForm]         = useState(true);

    const projectionData = useProjectionEngine({
        installments,
        simulations,
        currentMonthStats,
        monthsAhead,
    });

    useEffect(() => {
        saveSimulations(simulations);
    }, [simulations]);

    const handleAdd = useCallback((sim) => {
        setSimulations((prev) => [...prev, sim]);
    }, []);

    const handleRemove = useCallback((id) => {
        setSimulations((prev) => prev.filter((s) => s.id !== id));
    }, []);

    const handleClearAll = () => {
        setSimulations([]);
        clearStoredSimulations();
    };

    const totalActiveInstallments = installments.filter((i) => {
        const now = new Date().toISOString().slice(0, 7);
        return i.completion_month >= now;
    }).length;

    const totalRemainingReal = installments.reduce((sum, i) => {
        return sum + i.installment_amount * i.remaining_installments;
    }, 0);

    const simulatedImpactNextMonth = projectionData.months[0]?.simulatedTotal ?? 0;
    const totalSimulatedBurden = projectionData.totals.simulatedAll;

    return (
        <AuthenticatedLayout>
            <Head title="Projeção" />

            <FadeInContainer stagger className="flex flex-col gap-4 max-w-[1400px] mx-auto">
                <FadeInItem>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Projeção Financeira
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Simule compras e parcelamentos para visualizar o impacto futuro sem salvar no banco.
                            </p>
                        </div>
                        {simulations.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                                Limpar simulações
                            </button>
                        )}
                    </div>
                </FadeInItem>

                <FadeInItem>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            label="Crédito este mês"
                            value={formatCurrencyBRL(currentMonthStats.credit)}
                            sub="parcelamentos ativos"
                        />
                        <StatCard
                            label="Débito este mês"
                            value={formatCurrencyBRL(currentMonthStats.debit)}
                            sub="gastos diretos"
                        />
                        <StatCard
                            label="Parcelamentos ativos"
                            value={totalActiveInstallments}
                            sub={`${formatCurrencyBRL(totalRemainingReal)} restante`}
                        />
                        <StatCard
                            label="Impacto simulado"
                            value={formatCurrencyBRL(totalSimulatedBurden)}
                            sub={`${formatCurrencyBRL(simulatedImpactNextMonth)} no mês atual`}
                            accent={simulations.length > 0}
                        />
                    </div>
                </FadeInItem>

                <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4 items-start">
                    <FadeInItem className="flex flex-col gap-3">
                        <div className="themed-card rounded-2xl shadow-md overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowForm((p) => !p)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left"
                            >
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Adicionar simulação
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className={`h-4 w-4 text-gray-400 transition-transform ${showForm ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                >
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                                </svg>
                            </button>

                            <AnimatePresence initial={false}>
                                {showForm && (
                                    <motion.div
                                        key="form"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/8 pt-3">
                                            <SimulationPanel
                                                bankAccounts={bankAccounts}
                                                categories={categories}
                                                onAdd={handleAdd}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="themed-card rounded-2xl shadow-md p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    Simulações adicionadas
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {simulations.length} {simulations.length === 1 ? 'item' : 'itens'}
                                </span>
                            </div>

                            {simulations.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        Nenhuma simulação adicionada.
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Use o formulário acima para simular uma compra.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <AnimatePresence>
                                        {simulations.map((sim) => (
                                            <motion.div
                                                key={sim.id}
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.96, x: -10 }}
                                                transition={{ duration: 0.18 }}
                                            >
                                                <SimulationItem
                                                    simulation={sim}
                                                    onRemove={handleRemove}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </FadeInItem>

                    <FadeInItem>
                        <div className="themed-card rounded-2xl shadow-md p-4">
                            <ProjectionTimeline
                                projectionData={projectionData}
                                monthsAhead={monthsAhead}
                                onChangeMonthsAhead={setMonthsAhead}
                            />
                        </div>
                    </FadeInItem>
                </div>
            </FadeInContainer>
        </AuthenticatedLayout>
    );
}
