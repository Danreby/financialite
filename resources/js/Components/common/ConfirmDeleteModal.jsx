import Modal from '@/Components/common/Modal';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import DangerButton from '@/Components/common/buttons/DangerButton';

export default function ConfirmDeleteModal({
	isOpen,
	onClose,
	target,
	onConfirm,
	saving,
}) {
	const typeLabel = target.type === 'card' ? 'cartão' : 'categoria';

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title="Confirmar exclusão">
			<div className="space-y-4">
				<div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
						<svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
					</div>
					<div>
						<p className="text-sm font-medium text-red-900 dark:text-red-200">
							Remover {typeLabel}
						</p>
						<p className="text-xs text-red-700 dark:text-red-300">
							<strong>{target.name}</strong>
						</p>
					</div>
				</div>

				<p className="text-xs text-gray-500 dark:text-gray-400">
					Essa ação não pode ser desfeita. Todos os dados associados podem ser afetados.
				</p>

				<div className="flex items-center justify-end gap-2 pt-1">
					<SecondaryButton type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm">
						Cancelar
					</SecondaryButton>
					<DangerButton type="button" onClick={onConfirm} disabled={saving} className="rounded-xl">
						{saving ? 'Removendo...' : 'Remover'}
					</DangerButton>
				</div>
			</div>
		</Modal>
	);
}
