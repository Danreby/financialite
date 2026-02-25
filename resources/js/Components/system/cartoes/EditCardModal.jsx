import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import { useNumericInput } from '@/Hooks/useNumericInput';

const BRAND_OPTIONS = [
	{ value: '', label: 'Sem bandeira' },
	{ value: 'visa', label: 'Visa' },
	{ value: 'mastercard', label: 'Mastercard' },
	{ value: 'elo', label: 'Elo' },
	{ value: 'hipercard', label: 'Hipercard' },
	{ value: 'american_express', label: 'American Express' },
	{ value: 'diners_club', label: 'Diners Club' },
];

export default function EditCardModal({
	isOpen,
	onClose,
	card,
	dueDayInput,
	onDueDayChange,
	brandInput,
	onBrandChange,
	descriptionInput,
	onDescriptionChange,
	closingDayInput,
	onClosingDayChange,
	creditLimitInput,
	onCreditLimitChange,
	onSubmit,
	saving,
}) {
	const handleNumericInput = useNumericInput();

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Editar cartão">
			<form className="space-y-4" onSubmit={onSubmit} noValidate>
				<div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
					<span className="text-2xl">💳</span>
					<div>
						<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
							{card?.name || ''}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							{card?.due_day
								? `Vencimento atual: dia ${card.due_day}`
								: 'Sem vencimento definido'}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
							Dia de vencimento
						</label>
						<input
							type="number"
							min={1}
							max={31}
							inputMode="numeric"
							onKeyDown={handleNumericInput}
							value={dueDayInput}
							onChange={(e) => onDueDayChange(e.target.value)}
							className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							placeholder="Ex: 10"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
							Dia de fechamento
						</label>
						<input
							type="number"
							min={1}
							max={31}
							inputMode="numeric"
							onKeyDown={handleNumericInput}
							value={closingDayInput ?? ''}
							onChange={(e) => onClosingDayChange?.(e.target.value)}
							className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							placeholder="Ex: 5"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
							Bandeira
						</label>
						<select
							value={brandInput ?? ''}
							onChange={(e) => onBrandChange?.(e.target.value)}
							className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
						>
							{BRAND_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>{opt.label}</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
							Limite de crédito (R$)
						</label>
						<input
							type="number"
							step="0.01"
							min={0}
							value={creditLimitInput ?? ''}
							onChange={(e) => onCreditLimitChange?.(e.target.value)}
							className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							placeholder="Ex: 5000.00"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
						Descrição
					</label>
					<textarea
						value={descriptionInput ?? ''}
						onChange={(e) => onDescriptionChange?.(e.target.value)}
						placeholder="Observações sobre este cartão..."
						maxLength={500}
						rows={2}
						className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm resize-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
					/>
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
