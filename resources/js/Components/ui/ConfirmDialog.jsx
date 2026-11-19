import { AlertTriangle } from 'lucide-react';
import Modal from '@/Components/common/Modal';
import Button from './Button';

/**
 * Confirmação de ação (exclusão por padrão) sobre o Modal comum, que já
 * prende o foco, fecha no Esc e devolve o foco a quem abriu.
 */
export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar exclusão',
    description,
    confirmLabel = 'Excluir',
    cancelLabel = 'Cancelar',
    loading = false,
    loadingLabel = 'Excluindo…',
    tone = 'danger',
}) {
    return (
        <Modal isOpen={open} onClose={loading ? undefined : onClose} maxWidth="sm" title={title} closeOnOverlay={!loading}>
            <div className="flex items-start gap-3">
                {tone === 'danger' && (
                    <span className="icon-chip text-danger-strong">
                        <AlertTriangle aria-hidden="true" />
                    </span>
                )}
                <div className="pt-1.5 text-sm leading-6 text-content-secondary">{description}</div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                    {loading ? loadingLabel : confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
