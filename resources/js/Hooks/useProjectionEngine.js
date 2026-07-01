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

function billAppliesToMonth(bill, targetYM) {
    if (bill.start_date) {
        const startYM = bill.start_date.slice(0, 7);
        if (targetYM < startYM) return false;
    }
    if (bill.end_date) {
        const endYM = bill.end_date.slice(0, 7);
        if (targetYM > endYM) return false;
    }
    const tm = parseInt(targetYM.slice(5, 7), 10);
    switch (bill.recurrence_type) {
        case 'monthly': return true;
        case 'yearly':
            if (!bill.start_date) return false;
            return parseInt(bill.start_date.slice(5, 7), 10) === tm;
        case 'none':
            if (!bill.start_date) return false;
            return bill.start_date.slice(0, 7) === targetYM;
        default: return false;
    }
}

export function useProjectionEngine({
    creditTransactions = [],
    simulations        = [],
    bills              = [],
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

            const billsForMonth = bills.filter((b) => billAppliesToMonth(b, ym));
            const billKnownTotal = billsForMonth
                .filter((b) => b.amount !== null)
                .reduce((sum, b) => sum + b.amount, 0);
            const billVariableCount = billsForMonth.filter((b) => b.amount === null).length;
            const billBreakdown = billsForMonth.map((b) => ({
                id:              b.id,
                title:           b.title,
                amount:          b.amount,
                recurrence_type: b.recurrence_type,
                color:           b.color,
                icon:            b.icon,
            }));

            const realTotal      = realCreditTotal + realDebitTotal;
            const simulatedTotal = simulatedCreditTotal + simulatedDebitTotal;
            const combinedTotal  = realTotal + billKnownTotal + simulatedTotal;

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
                billKnownTotal,
                billVariableCount,
                billBreakdown,
                combinedTotal,
                installmentBreakdown,
                recurringBreakdown,
                simulationBreakdown,
            };
        });

        const totalRealAllMonths      = monthData.reduce((s, m) => s + m.realTotal, 0);
        const totalSimulatedAllMonths = monthData.reduce((s, m) => s + m.simulatedTotal, 0);
        const totalBillsAllMonths     = monthData.reduce((s, m) => s + m.billKnownTotal, 0);
        const highestCombinedMonth    = monthData.reduce(
            (max, m) => (m.combinedTotal > max.combinedTotal ? m : max),
            monthData[0] ?? { combinedTotal: 0 },
        );

        return {
            months: monthData,
            totals: {
                realAll:      totalRealAllMonths,
                simulatedAll: totalSimulatedAllMonths,
                billsAll:     totalBillsAllMonths,
                combinedAll:  totalRealAllMonths + totalBillsAllMonths + totalSimulatedAllMonths,
            },
            highestCombinedMonth,
        };
    }, [creditTransactions, simulations, bills, currentMonthStats, monthsAhead]);
}
