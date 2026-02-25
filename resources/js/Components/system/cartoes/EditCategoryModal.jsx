import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/Utils/categoryIcons';

const TYPE_OPTIONS = [
	{ value: 'expense', label: 'Despesa', emoji: '📉' },
	{ value: 'income', label: 'Receita', emoji: '📈' },
];

export default function EditCategoryModal({
	isOpen,
	onClose,
	nameInput,
	onNameChange,
	iconInput,
	onIconChange,
	colorInput,
	onColorChange,
	typeInput,
	onTypeChange,
	onSubmit,
	saving,
}) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Editar categoria">
			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
						Nome da categoria
					</label>
					<input
						type="text"
						value={nameInput}
						onChange={(e) => onNameChange(e.target.value)}
						className="w-full rounded-xl border border-gray-300 p-2.5 text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
						placeholder="Ex: Mercado, Lazer, Shopping"
						autoFocus
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
								onClick={() => onTypeChange?.(opt.value)}
								className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
									typeInput === opt.value
										? 'themed-selected border-theme-accent'
										: 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:border-gray-600'
								}`}
							>
								<span>{opt.emoji}</span> {opt.label}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
							Ícone
						</label>
						<div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
							{AVAILABLE_ICONS.map((iconItem) => (
								<button
									key={iconItem.name}
									type="button"
									onClick={() => onIconChange(iconItem.name)}
									className={`flex items-center justify-center p-2.5 rounded-xl border-2 transition-all ${
										iconInput === iconItem.name
											? 'themed-selected border-theme-accent scale-105'
											: 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f0f0f] dark:hover:bg-gray-900/50'
									}`}
									title={iconItem.label}
								>
									<span className="text-xl">{iconItem.icon}</span>
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
							Cor
						</label>
						<div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
							{AVAILABLE_COLORS.map((colorItem) => (
								<button
									key={colorItem.hex}
									type="button"
									onClick={() => onColorChange(colorItem.hex)}
									className={`w-full aspect-square rounded-xl border-2 transition-all ${
										colorInput === colorItem.hex
											? 'border-theme-accent ring-2 ring-theme-accent ring-offset-2 scale-110 dark:ring-offset-gray-900'
											: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
									}`}
									title={colorItem.name}
									style={{ backgroundColor: colorItem.hex }}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 pt-1">
					<SecondaryButton type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="submit" disabled={saving} className="rounded-xl">
						{saving ? 'Salvando...' : 'Salvar'}
					</PrimaryButton>
				</div>
			</form>
		</Modal>
	);
}
