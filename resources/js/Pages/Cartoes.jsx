import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import Pagination from '@/Components/common/Pagination';
import ScrollArea from '@/Components/common/ScrollArea';
import EmptyState from '@/Components/common/EmptyState';
import ConfirmDeleteModal from '@/Components/common/ConfirmDeleteModal';
import CardForm from '@/Components/system/CardForm';
import CategoryForm from '@/Components/system/CategoryForm';
import CardItem from '@/Components/system/cartoes/CardItem';
import CategoryItem from '@/Components/system/cartoes/CategoryItem';
import EditCardModal from '@/Components/system/cartoes/EditCardModal';
import EditCategoryModal from '@/Components/system/cartoes/EditCategoryModal';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';

export default function Cartoes({ bankAccounts, categories }) {
	const initialCards = useMemo(() => {
		if (Array.isArray(bankAccounts?.data)) return bankAccounts.data;
		if (Array.isArray(bankAccounts)) return bankAccounts;
		return [];
	}, []);

	const initialCategories = useMemo(() => {
		if (Array.isArray(categories?.data)) return categories.data;
		if (Array.isArray(categories)) return categories;
		return [];
	}, []);

	const [localCards, setLocalCards] = useState(initialCards);
	const [localCategories, setLocalCategories] = useState(initialCategories);
	const [saving, setSaving] = useState(false);

	const [isCardFormOpen, setIsCardFormOpen] = useState(false);
	const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

	const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
	const [cardBeingEdited, setCardBeingEdited] = useState(null);
	const [cardDueDayInput, setCardDueDayInput] = useState('');

	const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
	const [categoryBeingEdited, setCategoryBeingEdited] = useState(null);
	const [categoryNameInput, setCategoryNameInput] = useState('');
	const [categoryIconInput, setCategoryIconInput] = useState(null);
	const [categoryColorInput, setCategoryColorInput] = useState(null);

	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });

	useEffect(() => {
		const next = Array.isArray(bankAccounts?.data)
			? bankAccounts.data
			: Array.isArray(bankAccounts)
				? bankAccounts
				: [];
		setLocalCards(next);
	}, [bankAccounts]);

	useEffect(() => {
		const next = Array.isArray(categories?.data)
			? categories.data
			: Array.isArray(categories)
				? categories
				: [];
		setLocalCategories(next);
	}, [categories]);

	const openEditCardModal = (account) => {
		setCardBeingEdited(account);
		setCardDueDayInput(account.due_day ? String(account.due_day) : '');
		setIsEditCardModalOpen(true);
	};

	const handleSubmitEditCard = async (event) => {
		event.preventDefault();
		if (!cardBeingEdited || saving) return;

		const value = cardDueDayInput.trim();
		const parsed = parseInt(value, 10);
		if (Number.isNaN(parsed) || parsed < 1 || parsed > 31) {
			toast.error('Informe um dia de vencimento entre 1 e 31.');
			return;
		}

		setSaving(true);
		try {
			await axios.patch(route('cards.update-due-day', cardBeingEdited.id), { due_day: parsed });
			setLocalCards((prev) =>
				prev.map((acc) => (acc.id === cardBeingEdited.id ? { ...acc, due_day: parsed } : acc)),
			);
			toast.success('Vencimento atualizado com sucesso.');
			setIsEditCardModalOpen(false);
			setCardBeingEdited(null);
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível atualizar o vencimento.');
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
			if (errors?.color?.[0]) toast.error(errors.color[0]);
			else if (errors?.icon?.[0]) toast.error(errors.icon[0]);
			else toast.error('Não foi possível atualizar a categoria.');
		} finally {
			setSaving(false);
		}
	};

	const openConfirmDelete = (type, payload) => {
		if (type === 'card') {
			setConfirmTarget({ type: 'card', id: payload.bankId, name: payload.name });
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
			if (confirmTarget.type === 'card') {
				await axios.delete(route('cards.destroy', confirmTarget.id));
				setLocalCards((prev) => prev.filter((acc) => acc.card_id !== confirmTarget.id));
				toast.success('Cartão removido com sucesso.');
			}
			if (confirmTarget.type === 'category') {
				await axios.delete(route('categories.destroy', confirmTarget.id));
				setLocalCategories((prev) => prev.filter((cat) => cat.id !== confirmTarget.id));
				toast.success('Categoria removida.');
			}
		} catch (error) {
			console.error(error);
			if (confirmTarget.type === 'card') toast.error('Não foi possível remover o cartão.');
			else toast.error('Não foi possível remover a categoria.');
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

	const handleCardFormSuccess = (cardUser) => {
		if (!cardUser || !cardUser.id) return;
		const name = cardUser.card?.name || `Cartão #${cardUser.id}`;
		setLocalCards((prev) => {
			if (prev.some((acc) => acc.id === cardUser.id)) return prev;
			return [...prev, { id: cardUser.id, card_id: cardUser.card_id, name, due_day: cardUser.due_day }];
		});
	};

	const handleCategoryFormSuccess = (category) => {
		if (!category || !category.id || !category.name) return;
		setLocalCategories((prev) => {
			if (prev.some((c) => c.id === category.id)) return prev;
			return [...prev, { id: category.id, name: category.name, icon: category.icon, color: category.color }];
		});
	};

	const handleCloseEditCard = useCallback(() => {
		if (saving) return;
		setIsEditCardModalOpen(false);
		setCardBeingEdited(null);
	}, [saving]);

	const handleCloseEditCategory = useCallback(() => {
		if (saving) return;
		setIsEditCategoryModalOpen(false);
		setCategoryBeingEdited(null);
	}, [saving]);

	return (
		<AuthenticatedLayout>
			<Head title="Cartões & Categorias" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
				<FadeInItem type="fast">
					<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
								Cartões & Categorias
							</h1>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
								Gerencie seus cartões vinculados e categorias de transações.
							</p>
						</div>
						<div className="flex gap-2">
							<SecondaryButton
								type="button"
								onClick={() => setIsCategoryFormOpen(true)}
								className="rounded-xl px-3 py-2 text-xs sm:text-sm font-medium themed-outline-btn"
							>
								<span className="mr-1.5">🏷️</span> Nova Categoria
							</SecondaryButton>
							<PrimaryButton
								type="button"
								onClick={() => setIsCardFormOpen(true)}
								className="rounded-xl px-3 py-2 text-xs sm:text-sm font-medium"
							>
								<span className="mr-1.5">💳</span> Novo Cartão
							</PrimaryButton>
						</div>
					</header>
				</FadeInItem>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<FadeInItem type="subtle">
						<section className="rounded-2xl p-4 sm:p-5 shadow-md themed-card h-full">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2.5">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
										<span className="text-base">💳</span>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
											Cartões Vinculados
										</h2>
										<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
											{localCards.length} {localCards.length === 1 ? 'cartão' : 'cartões'}
										</p>
									</div>
								</div>
								{saving && (
									<span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
										Salvando...
									</span>
								)}
							</div>

							{localCards.length > 0 ? (
								<ScrollArea maxHeightClassName="max-h-[340px] sm:max-h-[380px] lg:max-h-[420px]" className="pr-1 space-y-2">
									<AnimatePresence mode="popLayout">
										{localCards.map((account) => (
											<CardItem
												key={account.id}
												account={account}
												onEdit={openEditCardModal}
												onDelete={(payload) => openConfirmDelete('card', payload)}
												saving={saving}
											/>
										))}
									</AnimatePresence>
								</ScrollArea>
							) : (
								<EmptyState
									icon="💳"
									title="Nenhum cartão vinculado"
									description="Adicione um cartão para começar a gerenciar suas faturas e transações."
								/>
							)}

							{bankAccounts?.links && <Pagination links={bankAccounts.links} className="mt-3" />}
						</section>
					</FadeInItem>

					<FadeInItem type="subtle">
						<section className="rounded-2xl p-4 sm:p-5 shadow-md themed-card h-full">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2.5">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20">
										<span className="text-base">🏷️</span>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
											Categorias
										</h2>
										<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
											{localCategories.length} {localCategories.length === 1 ? 'categoria' : 'categorias'}
										</p>
									</div>
								</div>
							</div>

							{localCategories.length > 0 ? (
								<ScrollArea maxHeightClassName="max-h-[340px] sm:max-h-[380px] lg:max-h-[420px]" className="pr-1 space-y-2">
									<AnimatePresence mode="popLayout">
										{localCategories.map((category) => (
											<CategoryItem
												key={category.id}
												category={category}
												onEdit={openEditCategoryModal}
												onDelete={(payload) => openConfirmDelete('category', payload)}
												saving={saving}
											/>
										))}
									</AnimatePresence>
								</ScrollArea>
							) : (
								<EmptyState
									icon="🏷️"
									title="Nenhuma categoria"
									description="Crie categorias para organizar melhor suas transações e relatórios."
								/>
							)}

							{categories?.links && <Pagination links={categories.links} className="mt-3" />}
						</section>
					</FadeInItem>
				</div>
			</FadeInContainer>

			<CardForm
				isOpen={isCardFormOpen}
				onClose={() => setIsCardFormOpen(false)}
				onSuccess={handleCardFormSuccess}
			/>

			<CategoryForm
				isOpen={isCategoryFormOpen}
				onClose={() => setIsCategoryFormOpen(false)}
				categories={localCategories}
				onSuccess={handleCategoryFormSuccess}
			/>

			<EditCardModal
				isOpen={isEditCardModalOpen}
				onClose={handleCloseEditCard}
				card={cardBeingEdited}
				dueDayInput={cardDueDayInput}
				onDueDayChange={setCardDueDayInput}
				onSubmit={handleSubmitEditCard}
				saving={saving}
			/>

			<EditCategoryModal
				isOpen={isEditCategoryModalOpen}
				onClose={handleCloseEditCategory}
				nameInput={categoryNameInput}
				onNameChange={setCategoryNameInput}
				iconInput={categoryIconInput}
				onIconChange={setCategoryIconInput}
				colorInput={categoryColorInput}
				onColorChange={setCategoryColorInput}
				onSubmit={handleSubmitEditCategory}
				saving={saving}
			/>

			<ConfirmDeleteModal
				isOpen={isConfirmModalOpen}
				onClose={handleCancelConfirmModal}
				target={confirmTarget}
				onConfirm={handleConfirmDelete}
				saving={saving}
			/>
		</AuthenticatedLayout>
	);
}
