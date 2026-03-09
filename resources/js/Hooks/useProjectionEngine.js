import { useMemo } from 'react';

function offsetMonth(baseYM, offset) {
    const [y, m] = baseYM.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function compareYM(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function realCreditAmountInMonth(tx, targetYM) {
    if (compareYM(targetYM, tx.first_billing_month) < 0) return 0;
    if (!tx.is_recurring && tx.completion_month && compareYM(targetYM, tx.completion_month) > 0) return 0;
    return tx.amount_per_month;
}

function simulatedAmountInMonth(simulation, targetYM) {
    if (compareYM(targetYM, simulation.startMonth) < 0) return 0;
    if (!simulation.is_recurring) {
        const end = offsetMonth(simulation.startMonth, (simulation.installments ?? 1) - 1);
        if (compareYM(targetYM, end) > 0) return 0;
    }
    return simulation.installmentAmount;
}

export function useProjectionEngine({
    creditTransactions = [],
    simulations        = [],
    currentMonthStats  = {},
    monthsAhead        = 24,
}) {
    return useMemo(() => {
        const baseYM = currentMonthStats.month ?? new Date().toISOString().slice(0, 7);

        const months = Array.from({ length: monthsAhead }, (_, i) => offsetMonth(baseYM, i));

        const monthData = months.map((ym) => {
            const isCurrentMonth = ym === baseYM;

            const realInstallmentTotal = creditTransactions
                .filter((t) => !t.is_recurring)
                .reduce((sum, t) => sum + realCreditAmountInMonth(t, ym), 0);

            const realRecurringTotal = creditTransactions
                .filter((t) => t.is_recurring)
                .reduce((sum, t) => sum + realCreditAmountInMonth(t, ym), 0);

            const realCreditTotal = realInstallmentTotal + realRecurringTotal;

            const realDebitTotal = isCurrentMonth ? (currentMonthStats.debit ?? 0) : 0;

            const simulatedCreditTotal = simulations
                .filter((s) => s.type === 'credit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            const simulatedDebitTotal = simulations
                .filter((s) => s.type === 'debit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            const realTotal      = realCreditTotal + realDebitTotal;
            const simulatedTotal = simulatedCreditTotal + simulatedDebitTotal;
            const combinedTotal  = realTotal + simulatedTotal;

            const installmentBreakdown = creditTransactions
                .filter((t) => !t.is_recurring && realCreditAmountInMonth(t, ym) > 0)
                .map((t) => ({
                    id:     t.id,
                    title:  t.title,
                    amount: t.amount_per_month,
                    type:   'credit',
                }));

            const recurringBreakdown = creditTransactions
                .filter((t) => t.is_recurring && realCreditAmountInMonth(t, ym) > 0)
                .map((t) => ({
                    id:     t.id,
                    title:  t.title,
                    amount: t.amount_per_month,
                    type:   'credit',
                }));

            const simulationBreakdown = simulations
                .filter((s) => simulatedAmountInMonth(s, ym) > 0)
                .map((s) => ({
                    id:        s.id,
                    title:     s.title,
                    amount:    simulatedAmountInMonth(s, ym),
                    type:      s.type,
                    recurring: s.is_recurring ?? false,
                }));

            return {
                ym,
                isCurrentMonth,
                realInstallmentTotal,
                realRecurringTotal,
                realCreditTotal,
                realDebitTotal,
                realTotal,
                simulatedCreditTotal,
                simulatedDebitTotal,
                simulatedTotal,
                combinedTotal,
                installmentBreakdown,
                recurringBreakdown,
                simulationBreakdown,
            };
        });

        const totalRealAllMonths      = monthData.reduce((s, m) => s + m.realTotal, 0);
        const totalSimulatedAllMonths = monthData.reduce((s, m) => s + m.simulatedTotal, 0);
        const highestCombinedMonth    = monthData.reduce(
            (max, m) => (m.combinedTotal > max.combinedTotal ? m : max),
            monthData[0] ?? { combinedTotal: 0 },
        );

        return {
            months: monthData,
            totals: {
                realAll:      totalRealAllMonths,
                simulatedAll: totalSimulatedAllMonths,
                combinedAll:  totalRealAllMonths + totalSimulatedAllMonths,
            },
            highestCombinedMonth,
        };
    }, [creditTransactions, simulations, currentMonthStats, monthsAhead]);
}
