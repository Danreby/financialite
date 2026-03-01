import { useMemo } from 'react';

/**
 * Builds a month key 'YYYY-MM' offset by `offset` months from now.
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
 * Returns the total real-installment amount billed in a given YYYY-MM month
 * for a single existing installment record.
 */
function realAmountInMonth(installment, targetYM) {
    const { first_billing_month, completion_month, installment_amount } = installment;
    if (compareYM(targetYM, first_billing_month) < 0) return 0;
    if (compareYM(targetYM, completion_month) > 0) return 0;
    return installment_amount;
}

/**
 * Returns the amount of a recurring transaction in a given YYYY-MM month.
 * A recurring transaction applies every month from start_month onwards.
 */
function recurringAmountInMonth(recurring, targetYM) {
    if (compareYM(targetYM, recurring.start_month) < 0) return 0;
    return recurring.amount;
}

/**
 * Returns the simulated installment amount billed in a given YYYY-MM month.
 */
function simulatedAmountInMonth(simulation, targetYM) {
    const start = simulation.startMonth;
    const end   = offsetMonth(start, simulation.installments - 1);
    if (compareYM(targetYM, start) < 0) return 0;
    if (compareYM(targetYM, end) > 0) return 0;
    return simulation.installmentAmount;
}

/**
 * Custom hook that computes monthly projection data.
 *
 * @param {Object}   params
 * @param {Array}    params.installments           - Real installment transactions from backend
 * @param {Array}    params.recurringTransactions  - Recurring transactions that repeat every month
 * @param {Array}    params.simulations            - Simulated items added by user
 * @param {Object}   params.currentMonthStats      - { credit, debit, month: 'YYYY-MM' }
 * @param {number}   params.monthsAhead            - How many months to project (default 24)
 */
export function useProjectionEngine({
    installments          = [],
    recurringTransactions = [],
    simulations           = [],
    currentMonthStats     = {},
    monthsAhead           = 24,
}) {
    return useMemo(() => {
        const baseYM = currentMonthStats.month ?? new Date().toISOString().slice(0, 7);

        const months = Array.from({ length: monthsAhead }, (_, i) => offsetMonth(baseYM, i));

        const monthData = months.map((ym) => {
            const isCurrentMonth = ym === baseYM;

            // Sum of all real installments due this month
            const realInstallmentTotal = installments.reduce(
                (sum, inst) => sum + realAmountInMonth(inst, ym),
                0,
            );

            // Sum of all recurring credit transactions active this month
            const realRecurringCreditTotal = recurringTransactions
                .filter((r) => r.type === 'credit')
                .reduce((sum, r) => sum + recurringAmountInMonth(r, ym), 0);

            // Sum of all recurring debit transactions active this month
            const realRecurringDebitTotal = recurringTransactions
                .filter((r) => r.type === 'debit')
                .reduce((sum, r) => sum + recurringAmountInMonth(r, ym), 0);

            const realCreditTotal = realInstallmentTotal + realRecurringCreditTotal;

            // Current-month debit (only available for the current month); recurring debit is always projected
            const realDebitTotal = (isCurrentMonth ? (currentMonthStats.debit ?? 0) : 0) + realRecurringDebitTotal;

            // Sum of simulated credit installments due this month
            const simulatedCreditTotal = simulations
                .filter((s) => s.type === 'credit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            // Sum of simulated debit items due this month
            const simulatedDebitTotal = simulations
                .filter((s) => s.type === 'debit')
                .reduce((sum, s) => sum + simulatedAmountInMonth(s, ym), 0);

            const realTotal      = realCreditTotal + realDebitTotal;
            const simulatedTotal = simulatedCreditTotal + simulatedDebitTotal;
            const combinedTotal  = realTotal + simulatedTotal;

            // Per-simulation breakdown for this month
            const simulationBreakdown = simulations
                .filter((s) => {
                    const start = s.startMonth;
                    const end   = offsetMonth(start, s.installments - 1);
                    return compareYM(ym, start) >= 0 && compareYM(ym, end) <= 0;
                })
                .map((s) => ({
                    id:     s.id,
                    title:  s.title,
                    amount: simulatedAmountInMonth(s, ym),
                    type:   s.type,
                }));

            // Per-recurring breakdown for this month
            const recurringBreakdown = recurringTransactions
                .filter((r) => recurringAmountInMonth(r, ym) > 0)
                .map((r) => ({
                    id:     r.id,
                    title:  r.title,
                    amount: r.amount,
                    type:   r.type,
                }));

            return {
                ym,
                isCurrentMonth,
                realInstallmentTotal,
                realRecurringCreditTotal,
                realRecurringDebitTotal,
                realCreditTotal,
                realDebitTotal,
                realTotal,
                simulatedCreditTotal,
                simulatedDebitTotal,
                simulatedTotal,
                combinedTotal,
                simulationBreakdown,
                recurringBreakdown,
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
    }, [installments, recurringTransactions, simulations, currentMonthStats, monthsAhead]);
}
