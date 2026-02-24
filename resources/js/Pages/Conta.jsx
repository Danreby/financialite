import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import DangerButton from '@/Components/common/buttons/DangerButton';
import ScrollArea from '@/Components/common/ScrollArea';
import CategoryBadge from '@/Components/common/CategoryBadge';
import Pagination from '@/Components/common/Pagination';
import { useNumericInput } from '@/Hooks/useNumericInput';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/Utils/categoryIcons';

function formatDueDay(dueDay) {
	if (!dueDay) return 'Não definido';
	return `Todo dia ${dueDay}`;
}

export default function Conta({ bankAccounts, categories }) {
	const initialBankAccounts = Array.isArray(bankAccounts?.data)
		? bankAccounts.data
		: Array.isArray(bankAccounts)
			? bankAccounts
			: [];

	const [localBankAccounts, setLocalBankAccounts] = useState(initialBankAccounts);
	const initialCategories = Array.isArray(categories?.data)
		? categories.data
		: Array.isArray(categories)
			? categories
			: [];

	const [localCategories, setLocalCategories] = useState(initialCategories);
	const [saving, setSaving] = useState(false);
	const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
	const [bankBeingEdited, setBankBeingEdited] = useState(null);
	const [bankDueDayInput, setBankDueDayInput] = useState('');
	const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
	const [categoryBeingEdited, setCategoryBeingEdited] = useState(null);
	const [categoryNameInput, setCategoryNameInput] = useState('');
	const [categoryIconInput, setCategoryIconInput] = useState(null);
	const [categoryColorInput, setCategoryColorInput] = useState(null);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });
	const handleNumericInput = useNumericInput();

	useEffect(() => {
		const nextBankAccounts = Array.isArray(bankAccounts?.data)
			? bankAccounts.data
			: Array.isArray(bankAccounts)
				? bankAccounts
				: [];
		setLocalBankAccounts(nextBankAccounts);
	}, [bankAccounts]);

	useEffect(() => {
		const nextCategories = Array.isArray(categories?.data)
			? categories.data
			: Array.isArray(categories)
				? categories
				: [];
		setLocalCategories(nextCategories);
	}, [categories]);

	const openEditBankModal = (account) => {
		setBankBeingEdited(account);
		setBankDueDayInput(account.due_day ? String(account.due_day) : '');
		setIsEditBankModalOpen(true);
	};

	const handleSubmitEditBank = async (event) => {
		event.preventDefault();
		if (!bankBeingEdited || saving) return;

		const value = bankDueDayInput.trim();
		const parsed = parseInt(value, 10);
		if (Number.isNaN(parsed) || parsed < 1 || parsed > 31) {
			toast.error('Informe um dia de vencimento entre 1 e 31.');
			return;
		}

		setSaving(true);
		try {
			await axios.patch(route('cards.update-due-day', bankBeingEdited.id), { due_day: parsed });
			setLocalBankAccounts((prev) =>
				prev.map((acc) => (acc.id === bankBeingEdited.id ? { ...acc, due_day: parsed } : acc)),
			);
			toast.success('Dia de vencimento atualizado.');
			setIsEditBankModalOpen(false);
			setBankBeingEdited(null);
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível atualizar o dia de vencimento.');
		} finally {
			setSaving(false);
		}
	};

	const openEditCategoryModal = (category) => {
		setCategoryBeingEdited(category);
		setCategoryNameInput(category.name || '');
		setCategoryIconInput(category.icon || null);
		setCategoryColorInput(category.color || null);
		setIsEditCategoryModalOpen(true);
	};

	const handleSubmitEditCategory = async (event) => {
		event.preventDefault();
		if (!categoryBeingEdited || saving) return;

		const name = categoryNameInput.trim();
		if (!name) {
			toast.error('O nome da categoria não pode ser vazio.');
			return;
		}

		setSaving(true);
		try {
			const payload = { name };
			if (categoryIconInput) payload.icon = categoryIconInput;
			if (categoryColorInput) payload.color = categoryColorInput;

			const response = await axios.put(route('categories.update', categoryBeingEdited.id), payload);
			const updated = response.data;
			setLocalCategories((prev) =>
				prev.map((cat) => (cat.id === categoryBeingEdited.id ? { ...cat, ...updated } : cat)),
			);
			toast.success('Categoria atualizada.');
			setIsEditCategoryModalOpen(false);
			setCategoryBeingEdited(null);
		} catch (error) {
			console.error(error);
			const errors = error.response?.data?.errors;
			if (errors?.color?.[0]) {
				toast.error(errors.color[0]);
			} else if (errors?.icon?.[0]) {
				toast.error(errors.icon[0]);
			} else {
				toast.error('Não foi possível atualizar a categoria.');
			}
		} finally {
			setSaving(false);
		}
	};

	const openConfirmDelete = (type, payload) => {
		if (type === 'bank') {
			setConfirmTarget({ type: 'bank', id: payload.bankId, name: payload.name });
		} else if (type === 'category') {
			setConfirmTarget({ type: 'category', id: payload.categoryId, name: payload.name });
		}
		setIsConfirmModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!confirmTarget.type || !confirmTarget.id) {
			setIsConfirmModalOpen(false);
			return;
		}

		setSaving(true);
		try {
			if (confirmTarget.type === 'bank') {
				await axios.delete(route('cards.destroy', confirmTarget.id));
				setLocalBankAccounts((prev) => prev.filter((acc) => acc.bank_id !== confirmTarget.id));
				toast.success('Conta removida com sucesso.');
			}

			if (confirmTarget.type === 'category') {
				await axios.delete(route('categories.destroy', confirmTarget.id));
				setLocalCategories((prev) => prev.filter((cat) => cat.id !== confirmTarget.id));
				toast.success('Categoria removida.');
			}
		} catch (error) {
			console.error(error);
			if (confirmTarget.type === 'bank') {
				toast.error('Não foi possível remover a conta.');
			} else {
				toast.error('Não foi possível remover a categoria.');
			}
		} finally {
			setSaving(false);
			setIsConfirmModalOpen(false);
			setConfirmTarget({ type: null, id: null, name: '' });
		}
	};

	const handleCancelConfirmModal = useCallback(() => {
		if (saving) return;
		setIsConfirmModalOpen(false);
		setConfirmTarget({ type: null, id: null, name: '' });
	}, [saving]);

	const handleCancelEditBank = useCallback(() => {
		if (saving) return;
		setIsEditBankModalOpen(false);
		setBankBeingEdited(null);
	}, [saving]);

	const handleCancelEditCategory = useCallback(() => {
		if (saving) return;
		setIsEditCategoryModalOpen(false);
		setCategoryBeingEdited(null);
	}, [saving]);

	return (
		<AuthenticatedLayout>
			<Head title="Contas" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-3 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
				<FadeInItem type="fast">
					<header className="space-y-1">
						<h1 className="text-xl sm:text-2xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100">Contas</h1>
						<p className="text-xs sm:text-sm lg:text-sm text-gray-600 dark:text-gray-300">
							Gerencie as contas bancárias vinculadas e as categorias usadas nas suas transações.
						</p>
					</header>
				</FadeInItem>

				<FadeInItem type="subtle">				<section className="rounded-2xl p-3 sm:p-3 lg:p-3 shadow-md themed-card">
					<div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
							Contas / bancos vinculados
						</h2>
						{saving && (
							<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Salvando...</span>
						)}
					</div>

					{localBankAccounts && localBankAccounts.length > 0 ? (
						<>
							<ScrollArea
								maxHeightClassName="max-h-[260px] md:max-h-[280px] lg:max-h-[300px] 2xl:max-h-[300px]"
								className="space-y-2"
							>
								{localBankAccounts.map((account) => (
								<div
									key={account.id}
									className="flex flex-col gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm sm:text-base lg:text-base shadow-sm dark:border-gray-800 dark:bg-black sm:flex-row sm:items-center sm:justify-between sm:py-3"
								>
									<div>
										<div className="font-medium text-gray-900 dark:text-gray-100">{account.name}</div>
										<div className="text-xs sm:text-sm lg:text-sm text-gray-500 dark:text-gray-400">
											{formatDueDay(account.due_day)}
										</div>
									</div>
									<div className="flex flex-wrap items-center justify-end gap-2 text-xs sm:text-sm lg:text-sm sm:flex-nowrap">
										<SecondaryButton
											type="button"
											onClick={() => openEditBankModal(account)}
											className="rounded-full px-4 py-1.5 text-[11px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide themed-outline-btn"
										>
											Alterar vencimento
										</SecondaryButton>
										<DangerButton
											type="button"
											onClick={() => openConfirmDelete('bank', { bankId: account.bank_id, name: account.name })}
											className="rounded-full px-4 py-1.5 text-[11px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide"
										>
											Remover
										</DangerButton>
									</div>
								</div>
							))}
							</ScrollArea>
							<Pagination links={bankAccounts?.links || []} />
						</>
					) : (
						<p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
							Nenhuma conta vinculada. Use o Dashboard ou as ações rápidas para adicionar um banco.
						</p>
					)}
				</section>
			</FadeInItem>

			<FadeInItem type="subtle">
				<section className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-3">
					<div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
							Categorias
						</h2>
						{saving && (
							<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Salvando...</span>
						)}
					</div>

					{localCategories && localCategories.length > 0 ? (
						<>
							<ScrollArea maxHeightClassName="max-h-[200px] md:max-h-[220px] lg:max-h-[240px] 2xl:max-h-[240px]">
								<ul className="divide-y divide-gray-200 dark:divide-gray-800 text-xs sm:text-sm lg:text-sm">
									{localCategories.map((category) => (
									<li
										key={category.id}
										className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
									>
										<CategoryBadge
											name={category.name}
											icon={category.icon}
											color={category.color}
											size="md"
										/>
										<div className="flex flex-wrap items-center justify-end gap-2 text-[11px] sm:text-xs lg:text-sm sm:flex-nowrap">
											<SecondaryButton
												type="button"
												onClick={() => openEditCategoryModal(category)}
												className="rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide themed-outline-btn"
											>
												Renomear
											</SecondaryButton>
											<DangerButton
												type="button"
												onClick={() => openConfirmDelete('category', { categoryId: category.id, name: category.name })}
												className="rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide"
											>
												Remover
											</DangerButton>
										</div>
									</li>
								))}
								</ul>
							</ScrollArea>
							<Pagination links={categories?.links || []} />
						</>
					) : (
						<p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
							Nenhuma categoria cadastrada. Use as ações rápidas para criar novas categorias.
						</p>
					)}
				</section>
			</FadeInItem>
		</FadeInContainer>

			<Modal
				isOpen={isEditBankModalOpen}
				onClose={() => {
					if (saving) return;
					setIsEditBankModalOpen(false);
					setBankBeingEdited(null);
				}}
				maxWidth="lg"
				title="Editar vencimento da conta"
			>
				<form className="space-y-3" onSubmit={handleSubmitEditBank} noValidate>
					<p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
						Conta:{' '}
						<span className="font-medium text-gray-900 dark:text-gray-100">
							{bankBeingEdited?.name || ''}
						</span>
					</p>
					<div className="flex flex-col gap-1">
						<label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
							Dia de vencimento (1 a 31)
						</label>
						<input
							type="number"
							min={1}
							max={31}
							inputMode="numeric"
							onKeyDown={handleNumericInput}
							value={bankDueDayInput}
							onChange={(e) => setBankDueDayInput(e.target.value)}
							className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm sm:text-base shadow-sm dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							placeholder="Ex: 10"
						/>
					</div>

					<div className="flex items-center justify-end gap-3 pt-2 text-xs sm:text-sm">
						<SecondaryButton
							type="button"
							onClick={handleCancelEditBank}
							className="rounded-lg px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="submit" disabled={saving}>
							{saving ? 'Salvando...' : 'Salvar'}
						</PrimaryButton>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={isEditCategoryModalOpen}
				onClose={useCallback(() => {
					if (saving) return;
					setIsEditCategoryModalOpen(false);
					setCategoryBeingEdited(null);
				}, [saving])}
				maxWidth="lg"
				title="Editar categoria"
			>
				<form className="space-y-3" onSubmit={handleSubmitEditCategory} noValidate>
					<div className="flex flex-col gap-1">
						<label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
							Nome da categoria
						</label>
						<input
							type="text"
							value={categoryNameInput}
							onChange={(e) => setCategoryNameInput(e.target.value)}
							className="w-full rounded-md border border-gray-300 p-2 text-sm sm:text-base shadow-sm dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							placeholder="Ex: Mercado, Lazer, Shopping"
						/>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
								Ícone da categoria
							</label>
							<div className="grid grid-cols-6 gap-2">
								{AVAILABLE_ICONS.map((iconItem) => (
									<button
										key={iconItem.name}
										type="button"
										onClick={() => setCategoryIconInput(iconItem.name)}
										className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
											categoryIconInput === iconItem.name
												? 'themed-selected border-theme-accent'
												: 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:bg-gray-900/50'
										}`}
										title={iconItem.label}
									>
										<span className="text-2xl">{iconItem.icon}</span>
									</button>
								))}
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
								Cor da categoria
							</label>
							<div className="grid grid-cols-7 gap-2">
								{AVAILABLE_COLORS.map((colorItem) => (
									<button
										key={colorItem.hex}
										type="button"
										onClick={() => setCategoryColorInput(colorItem.hex)}
										className={`w-full aspect-square rounded-lg border-2 transition-all ${
											categoryColorInput === colorItem.hex
												? 'border-theme-accent ring-2 ring-theme-accent ring-offset-2 dark:ring-offset-gray-900'
												: 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
										}`}
										title={colorItem.name}
										style={{ backgroundColor: colorItem.hex }}
									/>
								))}
							</div>
						</div>
					</div>

					<div className="flex items-center justify-end gap-3 pt-2 text-xs sm:text-sm">
						<SecondaryButton
							type="button"
							onClick={handleCancelEditCategory}
							className="rounded-lg px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Cancelar
						</SecondaryButton>
						<PrimaryButton type="submit" disabled={saving}>
							{saving ? 'Salvando...' : 'Salvar'}
						</PrimaryButton>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				onClose={useCallback(() => {
					if (saving) return;
					setIsConfirmModalOpen(false);
					setConfirmTarget({ type: null, id: null, name: '' });
				}, [saving])}
				maxWidth="sm"
				title="Confirmar exclusão"
			>
				<div className="space-y-4">
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
						Tem certeza de que deseja remover{' '}
						<span className="font-semibold text-gray-900 dark:text-gray-100">
							{confirmTarget.name}
						</span>
						?
					</p>
					<p className="text-[11px] text-gray-500 dark:text-gray-400">
						Essa ação não poderá ser desfeita.
					</p>
					<div className="flex items-center justify-end gap-3 pt-2 text-xs sm:text-sm">
						<SecondaryButton
							type="button"
							onClick={handleCancelConfirmModal}
							className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
						>
							Cancelar
						</SecondaryButton>
						<DangerButton type="button" onClick={handleConfirmDelete} disabled={saving}>
							{saving ? 'Removendo...' : 'Remover'}
						</DangerButton>
					</div>
				</div>
			</Modal>
		</AuthenticatedLayout>
	);
}

