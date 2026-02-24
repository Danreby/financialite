import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import { useNumericInput } from '@/Hooks/useNumericInput';

export default function EditCardModal({
	isOpen,
	onClose,
	card,
	dueDayInput,
	onDueDayChange,
	onSubmit,
	saving,
}) {
	const handleNumericInput = useNumericInput();

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" title="Editar vencimento do cartão">
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

				<div className="flex flex-col gap-1.5">
					<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
						Novo dia de vencimento
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
						autoFocus
					/>
					<p className="text-[11px] text-gray-400 dark:text-gray-500">
						Informe um valor entre 1 e 31.
					</p>
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
