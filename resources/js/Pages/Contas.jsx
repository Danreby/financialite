import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import DangerButton from '@/Components/common/buttons/DangerButton';
import StatsCard from '@/Components/common/StatsCard';
import ScrollArea from '@/Components/common/ScrollArea';
import BillForm from '@/Components/system/BillForm';
import BillPaymentForm from '@/Components/system/BillPaymentForm';
import BillCard from '@/Components/system/contas/BillCard';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import { formatCurrency, getNextDueInfo } from '@/Utils/bills';

export default function Contas({ bills: initialBills = [], categories = [] }) {
	const [bills, setBills] = useState(initialBills);
	const [saving, setSaving] = useState(false);
	const [filter, setFilter] = useState('all');
	const [search, setSearch] = useState('');

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingBill, setEditingBill] = useState(null);
	const [payingBill, setPayingBill] = useState(null);
	const [deletingBill, setDeletingBill] = useState(null);

	useEffect(() => {
		setBills(initialBills);
	}, [initialBills]);

	const stats = useMemo(() => {
		const active = bills.filter((b) => b.status === 'active');
		const totalMonthly = active
			.filter((b) => b.recurrence_type === 'monthly')
			.reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

		let overdue = 0;
		let upcoming = 0;
		active.forEach((b) => {
			const info = getNextDueInfo(b);
			if (info?.overdue) overdue++;
			else if (info?.daysUntil !== undefined && info.daysUntil <= 7) upcoming++;
		});

		return { total: bills.length, active: active.length, totalMonthly, overdue, upcoming };
	}, [bills]);

	const filteredBills = useMemo(() => {
		let result = [...bills];

		if (filter === 'active') result = result.filter((b) => b.status === 'active');
		else if (filter === 'inactive') result = result.filter((b) => b.status === 'inactive');
		else if (filter === 'overdue') {
			result = result.filter((b) => {
				const info = getNextDueInfo(b);
				return info?.overdue;
			});
		}

		if (search.trim()) {
			const term = search.toLowerCase().trim();
			result = result.filter((b) =>
				b.title.toLowerCase().includes(term) ||
				(b.description && b.description.toLowerCase().includes(term)) ||
				(b.category?.name && b.category.name.toLowerCase().includes(term))
			);
		}

		return result;
	}, [bills, filter, search]);

	const handleFormSuccess = useCallback(() => {
		setIsFormOpen(false);
		setEditingBill(null);
		router.reload({ only: ['bills'] });
	}, []);

	const handleEdit = (bill) => {
		setEditingBill(bill);
		setIsFormOpen(true);
	};

	const handlePay = (bill) => {
		const now = new Date();

		let dueDate;
		if (bill.recurrence_type === 'monthly') {
			const d = new Date(now.getFullYear(), now.getMonth(), bill.due_day);
			if (d <= now) d.setMonth(d.getMonth() + 1);
			dueDate = d.toISOString().split('T')[0];
		} else if (bill.start_date) {
			dueDate = bill.start_date;
		} else {
			dueDate = now.toISOString().split('T')[0];
		}

		setPayingBill({ ...bill, due_date: dueDate });
	};

	const handlePaySuccess = useCallback(() => {
		setPayingBill(null);
		toast.success('Pagamento registrado com sucesso!');
		router.reload({ only: ['bills'] });
	}, []);

	const handleToggle = async (bill) => {
		setSaving(true);
		try {
			await axios.patch(route('bills.toggle', bill.id));
			const newStatus = bill.status === 'active' ? 'inactive' : 'active';
			setBills((prev) =>
				prev.map((b) => (b.id === bill.id ? { ...b, status: newStatus } : b))
			);
			toast.success(newStatus === 'active' ? 'Conta ativada.' : 'Conta desativada.');
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível atualizar o status.');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = (bill) => {
		setDeletingBill(bill);
	};

	const confirmDelete = async () => {
		if (!deletingBill) return;
		setSaving(true);
		try {
			await axios.delete(route('bills.destroy', deletingBill.id));
			setBills((prev) => prev.filter((b) => b.id !== deletingBill.id));
			toast.success('Conta removida.');
			setDeletingBill(null);
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível remover a conta.');
		} finally {
			setSaving(false);
		}
	};

	const filterTabs = [
		{ key: 'all', label: 'Todas', count: bills.length },
		{ key: 'active', label: 'Ativas', count: stats.active },
		{ key: 'overdue', label: 'Vencidas', count: stats.overdue },
		{ key: 'inactive', label: 'Inativas', count: bills.length - stats.active },
	];

	return (
		<AuthenticatedLayout>
			<Head title="Contas a Pagar" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
				<FadeInItem type="fast">
					<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
								Contas a Pagar
							</h1>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
								Acompanhe suas contas recorrentes e pagamentos.
							</p>
						</div>
						<PrimaryButton
							type="button"
							onClick={() => { setEditingBill(null); setIsFormOpen(true); }}
							className="rounded-xl px-4 py-2 text-xs sm:text-sm font-medium"
						>
							<span className="mr-1.5">+</span> Nova Conta
						</PrimaryButton>
					</header>
				</FadeInItem>

				<FadeInItem type="subtle">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
						<StatsCard
							icon="📋"
							label="Total de Contas"
							value={stats.active}
							subText={`${stats.total} cadastradas`}
							colorClass="bg-blue-100 dark:bg-blue-900/30"
						/>
						<StatsCard
							icon="💰"
							label="Custo Mensal"
							value={formatCurrency(stats.totalMonthly)}
							colorClass="bg-emerald-100 dark:bg-emerald-900/30"
						/>
						<StatsCard
							icon="⚠️"
							label="Vencidas"
							value={stats.overdue}
							subText={stats.overdue > 0 ? 'Atenção!' : 'Nenhuma'}
							colorClass={stats.overdue > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}
						/>
						<StatsCard
							icon="📅"
							label="Próximos 7 dias"
							value={stats.upcoming}
							subText="a vencer"
							colorClass="bg-amber-100 dark:bg-amber-900/30"
						/>
					</div>
				</FadeInItem>

				<FadeInItem type="subtle">
					<div className="rounded-2xl shadow-md themed-card overflow-hidden">
						<div className="p-3 sm:p-4 border-b border-gray-200/70 dark:border-gray-800">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
									{filterTabs.map((tab) => (
										<button
											key={tab.key}
											onClick={() => setFilter(tab.key)}
											className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
												filter === tab.key
													? 'bg-theme-accent/10 text-theme-accent dark:bg-theme-accent/20'
													: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
											}`}
										>
											{tab.label}
											<span className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-semibold ${
												filter === tab.key
													? 'bg-theme-accent/20 text-theme-accent'
													: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
											}`}>
												{tab.count}
											</span>
										</button>
									))}
								</div>

								<div className="relative">
									<input
										type="text"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										placeholder="Buscar conta..."
										className="w-full sm:w-56 rounded-xl border border-gray-300 bg-white px-3 py-2 pl-9 text-xs sm:text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
									/>
									<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
									</svg>
								</div>
							</div>
						</div>

						<div className="p-3 sm:p-4">
							{filteredBills.length > 0 ? (
								<ScrollArea maxHeightClassName="max-h-[500px] sm:max-h-[560px]" className="pr-1 space-y-2">
									<AnimatePresence mode="popLayout">
										{filteredBills.map((bill) => (
											<BillCard
												key={bill.id}
												bill={bill}
												onEdit={handleEdit}
												onPay={handlePay}
												onToggle={handleToggle}
												onDelete={handleDelete}
												saving={saving}
											/>
										))}
									</AnimatePresence>
								</ScrollArea>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-3">
										<span className="text-2xl">{search ? '🔍' : '📋'}</span>
									</div>
									<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
										{search ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
									</h3>
									<p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
										{search
											? 'Tente buscar com outros termos.'
											: 'Adicione sua primeira conta para começar a acompanhar pagamentos.'}
									</p>
								</div>
							)}
						</div>
					</div>
				</FadeInItem>
			</FadeInContainer>

			<BillForm
				isOpen={isFormOpen}
				onClose={() => { setIsFormOpen(false); setEditingBill(null); }}
				onSuccess={handleFormSuccess}
				categories={categories}
				bill={editingBill}
			/>

			<BillPaymentForm
				isOpen={!!payingBill}
				onClose={() => setPayingBill(null)}
				onSuccess={handlePaySuccess}
				bill={payingBill}
			/>

			<Modal
				isOpen={!!deletingBill}
				onClose={() => !saving && setDeletingBill(null)}
				maxWidth="sm"
				title="Remover conta"
			>
				<div className="space-y-4">
					<div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
							<svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-red-900 dark:text-red-200">
								{deletingBill?.title}
							</p>
							<p className="text-xs text-red-700 dark:text-red-300">
								{formatCurrency(deletingBill?.amount)}
							</p>
						</div>
					</div>

					<p className="text-xs text-gray-500 dark:text-gray-400">
						Essa ação não pode ser desfeita. O histórico de pagamentos também será removido.
					</p>

					<div className="flex items-center justify-end gap-2 pt-1">
						<SecondaryButton
							type="button"
							onClick={() => setDeletingBill(null)}
							className="rounded-xl px-4 py-2 text-sm"
						>
							Cancelar
						</SecondaryButton>
						<DangerButton type="button" onClick={confirmDelete} disabled={saving} className="rounded-xl">
							{saving ? 'Removendo...' : 'Remover'}
						</DangerButton>
					</div>
				</div>
			</Modal>
		</AuthenticatedLayout>
	);
}
