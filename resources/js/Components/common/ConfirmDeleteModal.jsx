import Modal from '@/Components/common/Modal';
import { AlertCard, AlertCardButton } from '@/Components/common/AlertCard';

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
			<AlertCard
				icon={
					<svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
				}
				message={
					<>
						Remover {typeLabel} <strong>{target.name}</strong>? Essa ação não pode ser desfeita e todos os dados associados podem ser afetados.
					</>
				}
			>
				<AlertCardButton type="button" variant="neutral" onClick={onClose}>
					Cancelar
				</AlertCardButton>
				<AlertCardButton type="button" variant="danger" onClick={onConfirm} disabled={saving}>
					{saving ? 'Removendo...' : 'Remover'}
				</AlertCardButton>
			</AlertCard>
		</Modal>
	);
}
