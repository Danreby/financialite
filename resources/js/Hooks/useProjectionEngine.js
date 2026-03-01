import { useMemo } from 'react';

/**
 * Builds a month key 'YYYY-MM' offset by `offset` months from the baseYM.
 */
function offsetMonth(baseYM, offset) {
    const [y, m] = baseYM.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function compareYM(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Returns the amount billed for a real credit transaction in a given YYYY-MM.
 * Matches FaturaBillingService::faturaAppliesToMonth logic exactly:
 *  - Recurring: applies from first_billing_month indefinitely.
 *  - Installment: applies from first_billing_month to completion_month.
 */
function realCreditAmountInMonth(tx, targetYM) {
    if (compareYM(targetYM, tx.first_billing_month) < 0) return 0;
    if (!tx.is_recurring && tx.completion_month && compareYM(targetYM, tx.completion_month) > 0) return 0;
    return tx.amount_per_month;
}

/**
 * Returns the simulated amount billed in a given YYYY-MM month.
 * Supports both installment and recurring simulations.
 */
function simulatedAmountInMonth(simulation, targetYM) {
    if (compareYM(targetYM, simulation.startMonth) < 0) return 0;
    if (!simulation.is_recurring) {
        const end = offsetMonth(simulation.startMonth, (simulation.installments ?? 1) - 1);
        if (compareYM(targetYM, end) > 0) return 0;
    }
    return simulation.installmentAmount;
}

/**
 * Custom hook that computes monthly projection data exactly mirroring the Fatura page logic.
 *
 * @param {Object}  params
 * @param {Array}   params.creditTransactions  - All real credit transactions (installment + recurring)
 *                                               Each has: { id, title, amount_per_month, is_recurring,
 *                                                           first_billing_month, completion_month }
 * @param {Array}   params.simulations         - User-added simulations (installment or recurring)
 * @param {Object}  params.currentMonthStats   - { debit, month: 'YYYY-MM' }
 * @param {number}  params.monthsAhead         - How many months to project (default 24)
 */
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

            // ── Real credit breakdown ─────────────────────────────────────────
            const realInstallmentTotal = creditTransactions
                .filter((t) => !t.is_recurring)
                .reduce((sum, t) => sum + realCreditAmountInMonth(t, ym), 0);

            const realRecurringTotal = creditTransactions
                .filter((t) => t.is_recurring)
                .reduce((sum, t) => sum + realCreditAmountInMonth(t, ym), 0);

            const realCreditTotal = realInstallmentTotal + realRecurringTotal;

            // ── Debit: only current-month known actual debit ──────────────────
            const realDebitTotal = isCurrentMonth ? (currentMonthStats.debit ?? 0) : 0;

            // ── Simulated breakdown ───────────────────────────────────────────
            const simulatedCreditTotal = simulations
                .filter((s) => s.type === 'credit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            const simulatedDebitTotal = simulations
                .filter((s) => s.type === 'debit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            const realTotal      = realCreditTotal + realDebitTotal;
            const simulatedTotal = simulatedCreditTotal + simulatedDebitTotal;
            const combinedTotal  = realTotal + simulatedTotal;

            // Per-transaction breakdown (installment) for this month
            const installmentBreakdown = creditTransactions
                .filter((t) => !t.is_recurring && realCreditAmountInMonth(t, ym) > 0)
                .map((t) => ({
                    id:     t.id,
                    title:  t.title,
                    amount: t.amount_per_month,
                    type:   'credit',
                }));

            // Per-transaction breakdown (recurring) for this month
            const recurringBreakdown = creditTransactions
                .filter((t) => t.is_recurring && realCreditAmountInMonth(t, ym) > 0)
                .map((t) => ({
                    id:     t.id,
                    title:  t.title,
                    amount: t.amount_per_month,
                    type:   'credit',
                }));

            // Per-simulation breakdown for this month
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

        // Grand totals
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
