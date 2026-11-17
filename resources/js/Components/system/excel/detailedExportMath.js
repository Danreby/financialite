// Cálculos puros do relatório detalhado (sem dependência de React ou XLSX).
//
// Regra: transação no débito (compra paga à vista) é DESPESA. Receita vem
// somente das fontes de renda (`incomeSource`): renda recorrente mensal e
// entradas avulsas por mês ('AAAA-MM').

export const incomeForMonth = (incomeSource, monthKey) => {
  const monthly = Number(incomeSource?.monthlyRecurring) || 0;
  const oneTime = (incomeSource?.oneTime || [])
    .filter(i => i.month_key === monthKey)
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  return monthly + oneTime;
};

export const calculateExecutiveSummary = (transactions, monthlyData = [], incomeSource = null) => {
  const summary = {
    total_transactions: transactions.length,
    total_income: 0,
    total_expenses: 0,
    total_credit: 0,
    total_debit: 0,
    pending_debit: 0,
    pending_expenses: 0,
    paid_debit: 0,
    paid_expenses: 0,
    recurring_count: 0,
    installments_count: 0,
    categories_count: new Set(),
    cards_count: new Set(),
    period_start: null,
    period_end: null,
    recurring_amount: 0,
    non_recurring_amount: 0,
    overdue_count: 0,
    overdue_amount: 0,
  };

  const today = new Date();

  transactions.forEach(t => {
    const amount = parseFloat(t.amount) || 0;
    const installmentAmount = parseFloat(t.installment_amount) || amount;

    if (t.type === 'credit') {
      summary.total_credit += installmentAmount;
      summary.total_expenses += installmentAmount;
      if (t.status === 'pending') summary.pending_expenses += installmentAmount;
      if (t.status === 'paid') summary.paid_expenses += installmentAmount;

      if (t.is_recurring) {
        summary.recurring_amount += installmentAmount;
      } else {
        summary.non_recurring_amount += installmentAmount;
      }
    } else if (t.type === 'debit') {
      // Compra paga à vista: é despesa, não receita.
      summary.total_debit += amount;
      summary.total_expenses += amount;
      if (t.status === 'pending') {
        summary.pending_debit += amount;
        summary.pending_expenses += amount;
      }
      if (t.status === 'paid') {
        summary.paid_debit += amount;
        summary.paid_expenses += amount;
      }
    }

    if (t.status === 'pending' && t.due_date) {
      const dueDate = new Date(t.due_date);
      if (dueDate < today) {
        summary.overdue_count++;
        summary.overdue_amount += (t.type === 'credit' ? installmentAmount : amount);
      }
    }

    if (t.is_recurring) summary.recurring_count++;
    if (t.total_installments && t.total_installments > 1) summary.installments_count++;

    if (t.category?.name) summary.categories_count.add(t.category.name);
    if (t.bank_user?.bank?.name) summary.cards_count.add(t.bank_user.bank.name);

    if (t.created_at) {
      const date = new Date(t.created_at);
      if (!summary.period_start || date < summary.period_start) summary.period_start = date;
      if (!summary.period_end || date > summary.period_end) summary.period_end = date;
    }
  });

  // Receita: soma por mês presente no relatório, vinda das fontes de renda.
  summary.total_income = monthlyData.reduce(
    (sum, m) => sum + incomeForMonth(incomeSource, m.key),
    0,
  );

  return {
    ...summary,
    categories_count: summary.categories_count.size,
    cards_count: summary.cards_count.size,
    net_balance: summary.total_income - summary.total_expenses,
    average_income: summary.total_income / Math.max(monthlyData.length, 1),
    average_expense: summary.total_expenses / Math.max(summary.total_transactions, 1),
    recurring_percentage: summary.total_expenses > 0 ? (summary.recurring_amount / summary.total_expenses) * 100 : 0,
    non_recurring_percentage: summary.total_expenses > 0 ? (summary.non_recurring_amount / summary.total_expenses) * 100 : 0,
  };
};
