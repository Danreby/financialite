
import React, { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TransactionsList from "@/Components/system/transactions/TransactionsList";
import EditTransactionModal from "@/Components/system/transactions/EditTransactionModal";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import DangerButton from "@/Components/common/buttons/DangerButton";
import Modal from "@/Components/common/Modal";

export default function Transacao({ transactions = [], bankAccounts = [], categories = [] }) {
	const [localTransactions, setLocalTransactions] = useState(transactions);
	const [selectedBankId, setSelectedBankId] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [editingTransaction, setEditingTransaction] = useState(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeletingId, setIsDeletingId] = useState(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [transactionToDelete, setTransactionToDelete] = useState(null);

	const filteredTransactions = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		return localTransactions.filter((tx) => {
			if (selectedBankId && String(tx.bank_user_id) !== String(selectedBankId)) {
				return false;
			}
			if (selectedCategoryId && String(tx.category_id) !== String(selectedCategoryId)) {
				return false;
			}
			if (term && !(tx.title || "").toLowerCase().includes(term)) {
				return false;
			}
			return true;
		});
	}, [localTransactions, selectedBankId, selectedCategoryId, searchTerm]);

	const handleEdit = (tx) => {
		setEditingTransaction(tx);
		setIsEditModalOpen(true);
	};

	const handleUpdated = (updated) => {
		setLocalTransactions((prev) =>
			prev.map((tx) => {
				if (tx.id !== updated.id) return tx;
				return {
					...tx,
					...updated,
					bank_name: updated.bank_user?.bank?.name ?? tx.bank_name ?? null,
					category_name: updated.category?.name ?? tx.category_name ?? null,
				};
			})
		);
	};

	const handleDelete = async (tx) => {
		if (!tx || isDeletingId) return;
		setTransactionToDelete(tx);
		setIsDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!transactionToDelete || isDeletingId) return;

		setIsDeletingId(transactionToDelete.id);
		toast.dismiss();

		try {
			await axios.delete(route("faturas.destroy", transactionToDelete.id));
			toast.success("Transação removida com sucesso.");
			setLocalTransactions((prev) => prev.filter((item) => item.id !== transactionToDelete.id));
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

			<div className="mx-auto max-w-5xl space-y-6">
				<header className="space-y-2 pt-2">
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Transações pendentes
					</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Visualize, edite ou remova transações que ainda não foram pagas.
					</p>
				</header>

				<section className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
					<div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-600 dark:text-gray-300">
								Buscar
							</span>
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
								placeholder="Título da transação"
							/>
						</div>

						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-600 dark:text-gray-300">
								Banco
							</span>
							<select
								value={selectedBankId}
								onChange={(e) => setSelectedBankId(e.target.value)}
								className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							>
								<option value="">Todos</option>
								{bankAccounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>

						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-600 dark:text-gray-300">
								Categoria
							</span>
							<select
								value={selectedCategoryId}
								onChange={(e) => setSelectedCategoryId(e.target.value)}
								className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							>
								<option value="">Todas</option>
								{categories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>

						<SecondaryButton
							type="button"
							onClick={() => {
								setSelectedBankId("");
								setSelectedCategoryId("");
								setSearchTerm("");
							}}
							className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Limpar filtros
						</SecondaryButton>
					</div>

					<TransactionsList
						transactions={filteredTransactions}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				</section>
			</div>

			<EditTransactionModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				transaction={editingTransaction}
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

