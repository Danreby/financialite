import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "@/Components/common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from "@/Utils/categoryIcons";

const TYPE_OPTIONS = [
	{ value: 'expense', label: 'Despesa', emoji: '📉' },
	{ value: 'income', label: 'Receita', emoji: '📈' },
];

export default function CategoryForm({ isOpen, onClose, onSuccess, categories = [] }) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedIcon, setSelectedIcon] = useState(null);
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedType, setSelectedType] = useState('expense');

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		const form = event.currentTarget;
		const formData = new FormData(form);
		const name = formData.get("name")?.toString().trim();

		toast.dismiss();

		if (!name) {
			toast.error("Informe o nome da categoria.");
			form.elements.namedItem("name")?.focus();
			return;
		}

		const normalizedName = name.toLowerCase();
		const alreadyExists = (categories || []).some((category) => {
			if (!category || !category.name) return false;
			return category.name.toString().trim().toLowerCase() === normalizedName;
		});

		if (alreadyExists) {
			toast.error("Você já possui uma categoria com esse nome.");
			form.elements.namedItem("name")?.focus();
			return;
		}

		setIsSubmitting(true);

		try {
			const payload = { name, type: selectedType };
			if (selectedIcon) payload.icon = selectedIcon;
			if (selectedColor) payload.color = selectedColor;

			const response = await axios.post(route("categories.store"), payload);

			toast.success("Categoria criada com sucesso.");
			form.reset();
			setSelectedIcon(null);
			setSelectedColor(null);
			setIsSubmitting(false);
			if (onSuccess) onSuccess(response.data || {});
			if (onClose) onClose();
		} catch (error) {
			setIsSubmitting(false);

			if (error.response && error.response.status === 422) {
				const errors = error.response.data?.errors || {};
				if (errors.name?.[0]) {
					toast.error(errors.name[0]);
					form.elements.namedItem("name")?.focus();
					return;
				}
				if (errors.color?.[0]) {
					toast.error(errors.color[0]);
					return;
				}
				if (errors.icon?.[0]) {
					toast.error(errors.icon[0]);
					return;
				}
			}

			toast.error("Erro ao criar categoria.");
		}
	};

	const handleClose = () => {
		setSelectedIcon(null);
		setSelectedColor(null);
		setSelectedType('expense');
		if (onClose) onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			maxWidth="lg"
			title="Nova categoria"
		>
			<form className="space-y-5" onSubmit={handleSubmit} noValidate>

				{/* Nome */}
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
						Nome da categoria <span className="text-red-500">*</span>
					</label>
					<input
						id="name"
						name="name"
						type="text"
						maxLength={120}
						placeholder="Ex: Mercado, Lazer, Shopping"
						className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
						Tipo
					</label>
					<div className="flex gap-2">
						{TYPE_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								type="button"
								onClick={() => setSelectedType(opt.value)}
								className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
									selectedType === opt.value
										? 'themed-selected border-theme-accent'
										: 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:border-gray-600'
								}`}
							>
								<span>{opt.emoji}</span> {opt.label}
							</button>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
							Ícone
						</label>
						{selectedIcon && (
							<button
								type="button"
								onClick={() => setSelectedIcon(null)}
								className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							>
								{AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon} Limpar
							</button>
						)}
					</div>
					<div className="grid grid-cols-6 gap-2">
						{AVAILABLE_ICONS.map((iconItem) => (
							<button
								key={iconItem.name}
								type="button"
								onClick={() => setSelectedIcon(iconItem.name)}
								className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
									selectedIcon === iconItem.name
										? 'themed-selected border-theme-accent scale-110'
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
					<div className="flex items-center justify-between mb-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
							Cor
						</label>
						{selectedColor && (
							<button
								type="button"
								onClick={() => setSelectedColor(null)}
								className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							>
								<span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedColor }} />
								{AVAILABLE_COLORS.find(c => c.hex === selectedColor)?.name} — Limpar
							</button>
						)}
					</div>
					<div className="grid grid-cols-7 gap-2">
						{AVAILABLE_COLORS.map((colorItem) => (
							<button
								key={colorItem.hex}
								type="button"
								onClick={() => setSelectedColor(colorItem.hex)}
								className={`w-full aspect-square rounded-lg border-2 transition-all ${
									selectedColor === colorItem.hex
										? 'border-theme-accent ring-2 ring-theme-accent ring-offset-2 dark:ring-offset-gray-900 scale-110'
										: 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
								}`}
								title={colorItem.name}
								style={{ backgroundColor: colorItem.hex }}
							/>
						))}
					</div>
				</div>

				{(selectedIcon || selectedColor) && (
					<div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
						<div
							className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
							style={{ backgroundColor: selectedColor || '#6B7280' }}
						>
							{selectedIcon
								? AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon
								: '🏷️'}
						</div>
						<div>
							<p className="text-xs text-gray-500 dark:text-gray-400">Prévia da categoria</p>
							<p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
								{selectedIcon ? AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label : 'Sem ícone'}
								{selectedColor && <span className="ml-1.5 text-xs font-normal text-gray-500">· {AVAILABLE_COLORS.find(c => c.hex === selectedColor)?.name}</span>}
							</p>
						</div>
					</div>
				)}

				<div className="flex items-center justify-end gap-3 pt-1">
					<SecondaryButton type="button" onClick={handleClose}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Salvando..." : "Criar Categoria"}
					</PrimaryButton>
				</div>
			</form>
		</Modal>
	);
}
