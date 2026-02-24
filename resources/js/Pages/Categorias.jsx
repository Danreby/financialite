import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import ScrollArea from '@/Components/common/ScrollArea';
import EmptyState from '@/Components/common/EmptyState';
import ConfirmDeleteModal from '@/Components/common/ConfirmDeleteModal';
import CategoryForm from '@/Components/system/CategoryForm';
import CategoryItem from '@/Components/system/cartoes/CategoryItem';
import EditCategoryModal from '@/Components/system/cartoes/EditCategoryModal';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import { getIconEmoji, AVAILABLE_ICONS } from '@/Utils/categoryIcons';

export default function Categorias({ categories }) {
	const initialCategories = useMemo(() => {
		if (Array.isArray(categories?.data)) return categories.data;
		if (Array.isArray(categories)) return categories;
		return [];
	}, []);

	const [localCategories, setLocalCategories] = useState(initialCategories);
	const [saving, setSaving] = useState(false);

	const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

	const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
	const [categoryBeingEdited, setCategoryBeingEdited] = useState(null);
	const [categoryNameInput, setCategoryNameInput] = useState('');
	const [categoryIconInput, setCategoryIconInput] = useState(null);
	const [categoryColorInput, setCategoryColorInput] = useState(null);

	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });

	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const next = Array.isArray(categories?.data)
			? categories.data
			: Array.isArray(categories)
				? categories
				: [];
		setLocalCategories(next);
	}, [categories]);

	const filteredCategories = useMemo(() => {
		if (!searchQuery.trim()) return localCategories;
		const q = searchQuery.toLowerCase();
		return localCategories.filter((cat) => cat.name?.toLowerCase().includes(q));
	}, [localCategories, searchQuery]);

	const iconDistribution = useMemo(() => {
		const counts = {};
		for (const cat of localCategories) {
			const resolved = getIconEmoji(cat.icon) || '📁';
			counts[resolved] = (counts[resolved] || 0) + 1;
		}
		return counts;
	}, [localCategories]);

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
		if (type === 'category') {
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
			await axios.delete(route('categories.destroy', confirmTarget.id));
			setLocalCategories((prev) => prev.filter((cat) => cat.id !== confirmTarget.id));
			toast.success('Categoria removida.');
		} catch (error) {
			console.error(error);
			toast.error('Não foi possível remover a categoria.');
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

	const handleCategoryFormSuccess = (category) => {
		if (!category || !category.id || !category.name) return;
		setLocalCategories((prev) => {
			if (prev.some((c) => c.id === category.id)) return prev;
			return [...prev, { id: category.id, name: category.name, icon: category.icon, color: category.color }];
		});
	};

	const handleCloseEditCategory = useCallback(() => {
		if (saving) return;
		setIsEditCategoryModalOpen(false);
		setCategoryBeingEdited(null);
	}, [saving]);

	return (
		<AuthenticatedLayout>
			<Head title="Categorias" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
				{/* Header */}
				<FadeInItem type="fast">
					<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
								Categorias
							</h1>
							<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
								Organize suas transações com categorias personalizadas.
							</p>
						</div>
						<PrimaryButton
							type="button"
							onClick={() => setIsCategoryFormOpen(true)}
							className="rounded-xl px-4 py-2 text-xs sm:text-sm font-medium self-start sm:self-auto"
						>
							<span className="mr-1.5">🏷️</span> Nova Categoria
						</PrimaryButton>
					</header>
				</FadeInItem>

				{/* Stats bar */}
				<FadeInItem type="subtle">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<StatMini
							label="Total de categorias"
							value={localCategories.length}
							icon="🏷️"
						/>
						<StatMini
							label="Com ícone"
							value={localCategories.filter((c) => c.icon).length}
							icon="✨"
						/>
						<StatMini
							label="Com cor"
							value={localCategories.filter((c) => c.color).length}
							icon="🎨"
						/>
						<StatMini
							label="Ícones únicos"
							value={Object.keys(iconDistribution).length}
							icon="🔢"
						/>
					</div>
				</FadeInItem>

				{/* Search + Grid */}
				<FadeInItem type="subtle">
					<div className="rounded-2xl p-4 sm:p-5 shadow-md themed-card space-y-4">
						{/* Search */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2.5">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
									<span className="text-base">🏷️</span>
								</div>
								<div>
									<h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
										Suas Categorias
									</h2>
									<p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
										{localCategories.length} {localCategories.length === 1 ? 'categoria' : 'categorias'} cadastradas
									</p>
								</div>
							</div>

							<div className="relative w-full sm:w-56">
								<input
									type="text"
									placeholder="Buscar categoria..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
								/>
								<svg
									className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									aria-hidden="true"
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
								</svg>
							</div>
						</div>

						{filteredCategories.length > 0 ? (
							<ScrollArea maxHeightClassName="max-h-[460px] sm:max-h-[520px]" className="pr-1">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
									<AnimatePresence mode="popLayout">
										{filteredCategories.map((category) => (
											<CategoryItem
												key={category.id}
												category={category}
												onEdit={openEditCategoryModal}
												onDelete={(payload) => openConfirmDelete('category', payload)}
												saving={saving}
											/>
										))}
									</AnimatePresence>
								</div>
							</ScrollArea>
						) : (
							<EmptyState
								icon="🏷️"
								title={searchQuery ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
								description={
									searchQuery
										? `Nenhuma categoria corresponde a "${searchQuery}".`
										: 'Crie categorias para organizar melhor suas transações e relatórios.'
								}
							/>
						)}
					</div>
				</FadeInItem>

				{/* Icon palette preview */}
				{AVAILABLE_ICONS.length > 0 && (
					<FadeInItem type="subtle">
						<div className="rounded-2xl p-4 sm:p-5 shadow-md themed-card">
							<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
								Ícones disponíveis
							</h3>
							<div className="flex flex-wrap gap-2">
								{AVAILABLE_ICONS.map((iconDef) => (
									<div
										key={iconDef.name}
										className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-center hover:border-theme-accent/50 transition-colors"
										title={iconDef.label}
									>
										<span className="text-xl">{iconDef.icon}</span>
										<span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight max-w-[56px] truncate">{iconDef.label}</span>
									</div>
								))}
							</div>
						</div>
					</FadeInItem>
				)}
			</FadeInContainer>

			<CategoryForm
				isOpen={isCategoryFormOpen}
				onClose={() => setIsCategoryFormOpen(false)}
				categories={localCategories}
				onSuccess={handleCategoryFormSuccess}
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

function StatMini({ label, value, icon }) {
	return (
		<div className="rounded-2xl p-3 sm:p-4 shadow-md themed-card flex items-center gap-3">
			<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
				<span className="text-lg">{icon}</span>
			</div>
			<div className="min-w-0">
				<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
				<p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
			</div>
		</div>
	);
}
