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

	const now = new Date();
	const today = now.getDate();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	let dueDate = new Date(currentYear, currentMonth, bill.due_day);

	if (dueDate < now && today > bill.due_day) {
		const daysDiff = today - bill.due_day;
		if (daysDiff <= 15) {
			return { overdue: true, text: `Venceu há ${daysDiff} dia${daysDiff > 1 ? 's' : ''}`, daysUntil: -daysDiff };
		}
		dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
	}

	const diffTime = dueDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return { today: true, text: 'Vence hoje', daysUntil: 0, soon: true };
	if (diffDays < 0) return { overdue: true, text: `Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`, daysUntil: diffDays };
	if (diffDays <= 3) return { soon: true, text: `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`, daysUntil: diffDays };
	if (diffDays <= 7) return { soon: true, text: `Vence em ${diffDays} dias`, daysUntil: diffDays };

	return { text: `Vence em ${diffDays} dias`, daysUntil: diffDays };
}
