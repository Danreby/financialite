export function formatCurrency(value) {
	if (value == null) return 'R$ 0,00';
	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDueDay(dueDay) {
	if (!dueDay) return '—';
	return `dia ${dueDay}`;
}

export function getNextDueInfo(bill) {
	if (!bill.due_day || bill.status !== 'active') return null;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Bill already paid for the current billing period
	if (bill.is_paid_this_period) {
		if (!bill.next_due_date) return { paid: true, text: 'Pago', daysUntil: null };
		const nextDue = new Date(bill.next_due_date + 'T00:00:00');
		const daysUntil = Math.round((nextDue - today) / (1000 * 60 * 60 * 24));
		if (daysUntil <= 0) return { paid: true, text: 'Pago', daysUntil: 0 };
		return {
			paid: true,
			text: `Pago · próx. ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`,
			daysUntil,
		};
	}

	// Use server-computed next_due_date when available (may be in the past = overdue)
	let dueDate;
	if (bill.next_due_date) {
		dueDate = new Date(bill.next_due_date + 'T00:00:00');
	} else {
		// Fallback: compute from due_day only (no payment info)
		dueDate = new Date(today.getFullYear(), today.getMonth(), bill.due_day);
		if (dueDate < today) {
			dueDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day);
		}
	}

	const daysUntil = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

	if (daysUntil < 0) return { overdue: true, text: `Venceu há ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) !== 1 ? 's' : ''}`, daysUntil };
	if (daysUntil === 0) return { today: true, soon: true, text: 'Vence hoje', daysUntil: 0 };
	if (daysUntil <= 3) return { soon: true, text: `Vence em ${daysUntil} dia${daysUntil !== 1 ? 's' : ''}`, daysUntil };
	if (daysUntil <= 7) return { soon: true, text: `Vence em ${daysUntil} dias`, daysUntil };

	return { text: `Vence em ${daysUntil} dias`, daysUntil };
}
