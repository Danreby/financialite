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


function loadStoredSimulations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveSimulations(items) {
}


function StatCard({ label, value, sub, icon, accentBg = false }) {
    return (
        <div
            className="themed-card rounded-2xl p-3.5 lg:p-4 flex flex-col gap-1.5 relative overflow-hidden"
            style={accentBg ? {
                borderColor: 'color-mix(in srgb, var(--theme-accent) 35%, transparent)',
            } : {}}
        >
            {accentBg && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'color-mix(in srgb, var(--theme-accent) 5%, transparent)',
                    }}
                />
            )}
            <div className="flex items-center justify-between relative">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
                {icon && (
                    <span className="text-base leading-none" aria-hidden="true">{icon}</span>
                )}
            </div>
            <span
                className="text-xl lg:text-2xl font-bold relative"
                style={accentBg ? { color: 'var(--theme-accent)' } : {}}
            >
                <span className={!accentBg ? 'text-gray-900 dark:text-gray-100' : ''}>{value}</span>
            </span>
            {sub && (
                <span className="text-xs text-gray-400 dark:text-gray-500 relative leading-tight">{sub}</span>
            )}
        </div>
    );
}


export default function Projecao({
    installments          = [],
    recurringTransactions = [],
    bankAccounts          = [],
    categories            = [],
    currentMonthStats     = { credit: 0, debit: 0, month: '' },
}) {
    const [simulations, setSimulations] = useState(() => loadStoredSimulations());
    const [monthsAhead, setMonthsAhead] = useState(12);
    const [showForm, setShowForm]       = useState(true);

    const projectionData = useProjectionEngine({
        installments,
        recurringTransactions,
        simulations,
        currentMonthStats,
        monthsAhead,
    });

    useEffect(() => { saveSimulations(simulations); }, [simulations]);

    const handleAdd    = useCallback((sim) => setSimulations((p) => [...p, sim]), []);
    const handleRemove = useCallback((id) => setSimulations((p) => p.filter((s) => s.id !== id)), []);
    const handleClear  = () => {
        setSimulations([]);
    };

    const now = new Date().toISOString().slice(0, 7);

    const totalActiveInstallments  = installments.filter((i) => i.completion_month >= now).length;
    const totalRemainingReal       = installments.reduce(
        (s, i) => s + i.installment_amount * i.remaining_installments, 0,
    );
    const totalActiveRecurring     = recurringTransactions.filter((r) => r.start_month <= now).length;
    const monthlyRecurringExpense  = recurringTransactions
        .filter((r) => r.start_month <= now)
        .reduce((s, r) => s + r.amount, 0);
    const simulatedImpactNow   = projectionData.months[0]?.simulatedTotal ?? 0;
    const totalSimulatedBurden = projectionData.totals.simulatedAll;
    const hasSimulations       = simulations.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Projeções" />

            <FadeInContainer stagger className="flex flex-col gap-5 max-w-[1440px] mx-auto">

                <FadeInItem>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accentHover))' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="h-4 w-4" aria-hidden="true">
                                        <path fillRule="evenodd" d="M0 0h1v15h15v1H0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5z" />
                                    </svg>
                                </div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                    Projeção Financeira
                                </h1>
                                <span
                                    className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
                                        color: 'var(--theme-accent)',
                                    }}
                                >
                                    Simulador
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 dark:text-gray-500 pl-[42px] sm:pl-[42px]">
                                Veja o impacto de novas compras nas suas faturas, sem salvar nenhum dado.
                            </p>
                        </div>

                        {hasSimulations && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="shrink-0 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold transition px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/[0.25] hover:bg-red-50 dark:hover:bg-red-500/[0.08]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                </svg>
                                Limpar simulações
                            </button>
                        )}
                    </div>
                </FadeInItem>

                <FadeInItem>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        <StatCard
                            label="Parcelamentos ativos"
                            value={totalActiveInstallments}
                            sub={`${formatCurrencyBRL(totalRemainingReal)} restante total`}
                            icon="💳"
                        />
                        <StatCard
                            label="Recorrentes ativos"
                            value={totalActiveRecurring}
                            sub={`${formatCurrencyBRL(monthlyRecurringExpense)}/mês`}
                            icon="🔁"
                        />
                        <StatCard
                            label="Total projetado (real)"
                            value={formatCurrencyBRL(projectionData.totals.realAll)}
                            sub={`próximos ${monthsAhead} meses`}
                            icon="📊"
                        />
                        <StatCard
                            label="Total simulado"
                            value={formatCurrencyBRL(totalSimulatedBurden)}
                            sub={
                                simulatedImpactNow > 0
                                    ? `+${formatCurrencyBRL(simulatedImpactNow)} este mês`
                                    : `${formatCurrencyBRL(totalSimulatedBurden)} nos próximos ${monthsAhead} meses`
                            }
                            icon="🧮"
                            accentBg={hasSimulations}
                        />
                    </div>
                </FadeInItem>

                <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 items-start">

                    <FadeInItem className="flex flex-col gap-3">

                        <div className="themed-card rounded-2xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowForm((p) => !p)}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-5 w-5 rounded-md flex items-center justify-center text-white shrink-0"
                                        style={{ background: 'var(--theme-accent)' }}
                                        aria-hidden="true"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                                            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
                                        </svg>
                                    </span>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                        Nova simulação
                                    </span>
                                </div>
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
                                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
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

                        <div className="themed-card rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    Simulações
                                </span>
                                <span
                                    className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                                    style={hasSimulations ? {
                                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 13%, transparent)',
                                        color: 'var(--theme-accent)',
                                    } : {
                                        backgroundColor: 'rgba(156,163,175,0.12)',
                                        color: 'rgb(156,163,175)',
                                    }}
                                >
                                    {simulations.length} {simulations.length === 1 ? 'item' : 'itens'}
                                </span>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {simulations.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center text-center py-8 gap-2"
                                    >
                                        <div
                                            className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}
                                        >
                                            🧮
                                        </div>
                                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                                            Nenhuma simulação
                                        </p>
                                        <p className="text-xs text-gray-300 dark:text-gray-600 max-w-[200px] leading-relaxed">
                                            Adicione uma compra acima para ver o impacto nas suas faturas
                                        </p>
                                    </motion.div>
                                ) : (
                                    simulations.map((sim) => (
                                        <motion.div
                                            key={sim.id}
                                            layout
                                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -16, scale: 0.96 }}
                                            transition={{ duration: 0.18 }}
                                        >
                                            <SimulationItem simulation={sim} onRemove={handleRemove} />
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </FadeInItem>

                    <FadeInItem>
                        <div className="themed-card rounded-2xl p-4 lg:p-5">
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


