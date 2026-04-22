import React, { useEffect, useState, useRef, useMemo } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowDownLeft, CreditCard, TrendingDown } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TransactionsList from "@/Components/system/transactions/TransactionsList";
import EditTransactionModal from "@/Components/system/transactions/EditTransactionModal";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import DangerButton from "@/Components/common/buttons/DangerButton";
import Modal from "@/Components/common/Modal";
import Pagination from "@/Components/common/Pagination";
import TransactionFilters from "@/Components/system/transactions/TransactionFilters";
import FaturaDetailModal from "@/Components/system/fatura/FaturaDetailModal";
import FadeInContainer, { FadeInItem } from "@/Components/common/FadeInContainer";
import { formatCurrencyBRL } from "@/Lib/formatters";

export default function Transacao({ transactions, bankAccounts = [], categories = [], months = [], filters = {}, filterTotals = {} }) {
	const initialTransactions = Array.isArray(transactions?.data)
		? transactions.data
		: Array.isArray(transactions)
			? transactions
			: [];

	const [selectedBankId, setSelectedBankId] = useState(String(filters?.bank_user_id ?? ""));
	const [selectedCategoryId, setSelectedCategoryId] = useState(String(filters?.category_id ?? ""));
	const [selectedType, setSelectedType] = useState(String(filters?.type ?? ""));
	const [selectedStatus, setSelectedStatus] = useState(String(filters?.status ?? ""));
	const [recurringFilter, setRecurringFilter] = useState(String(filters?.recurring ?? ""));
	const [searchTerm, setSearchTerm] = useState(String(filters?.search ?? ""));
	const [selectedMonthKey, setSelectedMonthKey] = useState(String(filters?.month_key ?? ""));
	const [selectedOrder, setSelectedOrder] = useState(String(filters?.order ?? "created_desc"));

	const orderOptions = [
		{ key: "created", label: "Data" },
		{ key: "title", label: "A-Z" },
		{ key: "amount", label: "Valor" },
	];
	const [editingTransaction, setEditingTransaction] = useState(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [transactionToDelete, setTransactionToDelete] = useState(null);
	const [isDeletingId, setIsDeletingId] = useState(null);
	const [detailTransaction, setDetailTransaction] = useState(null);
	const isFirstRender = useRef(true);

	const stats = useMemo(() => {
		const total = transactions?.total ?? initialTransactions.length;
		const currentPage = transactions?.current_page ?? 1;
		const lastPage = transactions?.last_page ?? 1;

		// Per-page page sums (informational)
		let pageDebitSum = 0;
		let pageCreditSum = 0;
		for (const tx of initialTransactions) {
			const amt = Number(tx.amount || 0);
			if (tx.type === "credit") pageCreditSum += amt;
			else pageDebitSum += amt;
		}

		// Full-filter totals from backend
		const debitTotal  = Number(filterTotals?.debit_total  ?? 0);
		const creditTotal = Number(filterTotals?.credit_total ?? 0);
		const debitCount  = Number(filterTotals?.debit_count  ?? 0);
		const creditCount = Number(filterTotals?.credit_count ?? 0);
		const totalCount  = Number(filterTotals?.total_count  ?? total);
		const netTotal    = debitTotal + creditTotal;

		return {
			total, currentPage, lastPage,
			debitTotal, creditTotal, debitCount, creditCount, totalCount, netTotal,
			pageDebitSum, pageCreditSum,
			isMultiPage: lastPage > 1,
		};
	}, [initialTransactions, transactions, filterTotals]);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		const timeout = setTimeout(() => {
			router.get(route('transactions.index'), {
				bank_user_id: selectedBankId || undefined,
				category_id: selectedCategoryId || undefined,
				type: selectedType || undefined,
				status: selectedStatus || undefined,
				recurring: recurringFilter || undefined,
				search: searchTerm || undefined,
				month_key: selectedMonthKey || undefined,
				order: selectedOrder || undefined,
			}, {
				preserveState: true,
				preserveScroll: true,
				replace: true,
			});
		}, 300);

		return () => clearTimeout(timeout);
	}, [selectedBankId, selectedCategoryId, selectedType, selectedStatus, recurringFilter, searchTerm, selectedMonthKey, selectedOrder]);

	const handleEdit = (tx) => {
		setEditingTransaction(tx);
		setIsEditModalOpen(true);
	};

	const handleUpdated = () => {
		router.get(route('transactions.index'), {
			bank_user_id: selectedBankId || undefined,
			category_id: selectedCategoryId || undefined,
			type: selectedType || undefined,
			status: selectedStatus || undefined,
			recurring: recurringFilter || undefined,
			search: searchTerm || undefined,
			month_key: selectedMonthKey || undefined,
			order: selectedOrder || undefined,
		}, { preserveState: true, preserveScroll: true, replace: true });
	};

	const handleDelete = async (tx) => {
		if (!tx || isDeletingId) return;
		setTransactionToDelete(tx);
		setIsDeleteConfirmOpen(true);
	};

	const handleShowDetails = (tx) => {
		if (!tx) return;
		setDetailTransaction(tx);
	};

	const clearFilters = () => {
		setSelectedBankId("");
		setSelectedCategoryId("");
		setSelectedType("");
		setSelectedStatus("");
		setRecurringFilter("");
		setSearchTerm("");
		setSelectedMonthKey("");
		setSelectedOrder("created_desc");
	};

	const handleConfirmDelete = async () => {
		if (!transactionToDelete || isDeletingId) return;

		setIsDeletingId(transactionToDelete.id);
		toast.dismiss();

		try {
			await axios.delete(route("transacoes.destroy", transactionToDelete.id));
			toast.success("Transação removida com sucesso.");
			router.get(route('transactions.index'), {
				bank_user_id: selectedBankId || undefined,
				category_id: selectedCategoryId || undefined,
				type: selectedType || undefined,
				status: selectedStatus || undefined,
				recurring: recurringFilter || undefined,
				search: searchTerm || undefined,
				month_key: selectedMonthKey || undefined,
				order: selectedOrder || undefined,
			}, { preserveState: true, preserveScroll: true, replace: true });
		} catch (error) {
			console.error(error);
			if (error.response?.data?.message) {
				toast.error(error.response.data.message);
			} else {
				toast.error("Erro ao remover transação.");
			}
		} finally {
			setIsDeletingId(null);
			setIsDeleteConfirmOpen(false);
			setTransactionToDelete(null);
		}
	};

	return (
		<AuthenticatedLayout>
			<Head title="Transações" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">

				<FadeInItem type="fast">
					<header className="flex items-start justify-between gap-3 pt-1 sm:pt-1.5">
						<div>
							<h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
								Transações
							</h1>
							<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
								{stats.totalCount > 0 ? (
									<>
										<span className="font-medium text-gray-700 dark:text-gray-300">{stats.totalCount}</span>
										{" "}transaç{stats.totalCount === 1 ? "ão" : "ões"} encontrada{stats.totalCount === 1 ? "" : "s"}
										{stats.isMultiPage && (
											<span className="text-gray-400 dark:text-gray-500"> · página {stats.currentPage} de {stats.lastPage}</span>
										)}
									</>
								) : (
									"Nenhuma transação encontrada"
								)}
							</p>
						</div>
					</header>
				</FadeInItem>

				{stats.totalCount > 0 && (
					<FadeInItem type="subtle">
						<div className="rounded-2xl themed-card overflow-hidden">
							<div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800/60">
								<div className="flex items-center gap-3 flex-1">
									<div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--theme-accent)]/10">
										<TrendingDown className="h-5 w-5 text-[var(--theme-accent)]" />
									</div>
									<div>
										<p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
											Total filtrado
										</p>
										<p className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
											{formatCurrencyBRL(stats.netTotal)}
										</p>
									</div>
								</div>

								{stats.debitTotal > 0 && stats.creditTotal > 0 && (
									<div className="sm:w-48 flex flex-col gap-1.5">
										<div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
											<span>Débito</span>
											<span>Crédito</span>
										</div>
										<div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
											<div
												className="h-full bg-red-400 dark:bg-red-500 rounded-l-full transition-all"
												style={{ width: `${(stats.debitTotal / stats.netTotal) * 100}%` }}
											/>
											<div
												className="h-full bg-purple-400 dark:bg-purple-500 rounded-r-full transition-all"
												style={{ width: `${(stats.creditTotal / stats.netTotal) * 100}%` }}
											/>
										</div>
										<div className="flex justify-between text-[10px] font-semibold tabular-nums">
											<span className="text-red-500 dark:text-red-400">{Math.round((stats.debitTotal / stats.netTotal) * 100)}%</span>
											<span className="text-purple-500 dark:text-purple-400">{Math.round((stats.creditTotal / stats.netTotal) * 100)}%</span>
										</div>
									</div>
								)}
							</div>

							<div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800/60">
								<div className="flex items-center gap-3 p-4">
									<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
										<ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
									</div>
									<div className="min-w-0">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
											Débito
										</p>
										<p className="text-base font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight">
											{formatCurrencyBRL(stats.debitTotal)}
										</p>
										<p className="text-[11px] text-gray-400 dark:text-gray-500">
											{stats.debitCount} transaç{stats.debitCount === 1 ? "ão" : "ões"}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 p-4">
									<div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
										<CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
									</div>
									<div className="min-w-0">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
											Crédito
										</p>
										<p className="text-base font-bold tabular-nums text-purple-600 dark:text-purple-400 leading-tight">
											{formatCurrencyBRL(stats.creditTotal)}
										</p>
										<p className="text-[11px] text-gray-400 dark:text-gray-500">
											{stats.creditCount} transaç{stats.creditCount === 1 ? "ão" : "ões"}
										</p>
									</div>
								</div>
							</div>
						</div>
					</FadeInItem>
				)}

				<FadeInItem type="subtle">
					<section className="rounded-2xl p-4 shadow-md themed-card sm:p-5">
					<TransactionFilters
						searchTerm={searchTerm}
						onSearchChange={setSearchTerm}
						months={months}
						selectedMonthKey={selectedMonthKey}
						onMonthChange={(value) => setSelectedMonthKey(value)}
						orderOptions={orderOptions}
						selectedOrder={selectedOrder}
						onOrderChange={setSelectedOrder}
						bankAccounts={bankAccounts}
						selectedBankId={selectedBankId}
						onBankChange={setSelectedBankId}
						selectedType={selectedType}
						onTypeChange={setSelectedType}
						selectedStatus={selectedStatus}
						onStatusChange={setSelectedStatus}
						recurringFilter={recurringFilter}
						onRecurringChange={setRecurringFilter}
						categories={categories}
						selectedCategoryId={selectedCategoryId}
						onCategoryChange={setSelectedCategoryId}
						onClear={clearFilters}
					/>

					<TransactionsList
						transactions={initialTransactions}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onShowDetails={handleShowDetails}
					/>

						<Pagination links={transactions?.links || []} />
					</section>
				</FadeInItem>
			</FadeInContainer>

			<EditTransactionModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				transaction={editingTransaction}
				bankAccounts={bankAccounts}
				categories={categories}
				onUpdated={handleUpdated}
			/>

			<FaturaDetailModal
				isOpen={!!detailTransaction}
				onClose={() => setDetailTransaction(null)}
				item={detailTransaction}
				bankAccounts={bankAccounts}
				categories={categories}
				onUpdated={handleUpdated}
			/>

			<Modal
				isOpen={isDeleteConfirmOpen}
				onClose={() => {
					if (isDeletingId) return;
					setIsDeleteConfirmOpen(false);
					setTransactionToDelete(null);
				}}
				title="Remover transação"
				maxWidth="sm"
			>
				<p className="text-sm text-gray-600 dark:text-gray-300">
					Tem certeza que deseja remover a transação
					{" "}
					<span className="font-semibold">
						{transactionToDelete?.title ?? "selecionada"}
					</span>
					?
				</p>
				<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
					Essa ação é permanente e não poderá ser desfeita.
				</p>

				<div className="mt-5 flex items-center justify-end gap-3">
					<SecondaryButton
						type="button"
						onClick={() => {
							if (isDeletingId) return;
							setIsDeleteConfirmOpen(false);
							setTransactionToDelete(null);
						}}
						className="rounded-lg px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						Cancelar
					</SecondaryButton>
					<DangerButton
						type="button"
						onClick={handleConfirmDelete}
						disabled={Boolean(isDeletingId)}
						className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide"
					>
						{isDeletingId ? "Removendo..." : "Remover"}
					</DangerButton>
				</div>
			</Modal>
		</AuthenticatedLayout>
	);
}

