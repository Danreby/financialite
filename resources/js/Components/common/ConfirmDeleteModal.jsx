import ConfirmDialog from '@/Components/ui/ConfirmDialog';

const TYPE_LABELS = { card: 'cartão', bank: 'conta bancária' };

/** Legado: use `@/Components/ui/ConfirmDialog`. Invólucro fino. */
export default function ConfirmDeleteModal({ isOpen, onClose, target, onConfirm, saving }) {
	const typeLabel = TYPE_LABELS[target?.type] ?? 'categoria';

	return (
		<ConfirmDialog
			open={isOpen}
			onClose={onClose}
			onConfirm={onConfirm}
			loading={saving}
			confirmLabel="Remover"
			loadingLabel="Removendo…"
			description={
				<>
					Remover {typeLabel} <strong className="font-semibold text-content-primary">{target?.name}</strong>? Essa ação não pode ser desfeita e os dados ligados a ele podem ser afetados.
				</>
			}
		/>
	);
}
