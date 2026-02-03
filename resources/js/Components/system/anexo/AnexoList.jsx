import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileIcon, getFileIconColor, DownloadIcon, TrashIcon, EyeIcon, LoadingSpinner } from '../../common/icons/FileIcons';

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const AnexoItem = React.forwardRef(({
    anexo,
    onPreview,
    onDownload,
    onDelete,
    deleting = false,
}, ref) => {
    const canPreview = anexo.is_image || anexo.is_pdf;

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            <div
                className={`
                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                    ${anexo.is_image ? 'bg-blue-100 dark:bg-blue-900/40' : ''}
                    ${anexo.is_pdf ? 'bg-red-100 dark:bg-red-900/40' : ''}
                    ${anexo.is_spreadsheet ? 'bg-green-100 dark:bg-green-900/40' : ''}
                    ${!anexo.is_image && !anexo.is_pdf && !anexo.is_spreadsheet ? 'bg-gray-100 dark:bg-gray-700' : ''}
                `}
            >
                <span className={getFileIconColor(anexo.icon_type)}>
                    {getFileIcon(anexo.icon_type, 'w-5 h-5')}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {anexo.original_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{anexo.formatted_size}</span>
                    <span>•</span>
                    <span>{formatDate(anexo.created_at)}</span>
                </div>
                {anexo.description && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                        {anexo.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canPreview && (
                    <button
                        type="button"
                        onClick={() => onPreview?.(anexo)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Visualizar"
                    >
                        <EyeIcon className="w-4 h-4" />
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onDownload?.(anexo)}
                    className="p-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                    title="Baixar"
                >
                    <DownloadIcon className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete?.(anexo)}
                    disabled={deleting}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    title="Remover"
                >
                    {deleting ? (
                        <LoadingSpinner className="w-4 h-4" />
                    ) : (
                        <TrashIcon className="w-4 h-4" />
                    )}
                </button>
            </div>
        </motion.div>
    );
});

AnexoItem.displayName = 'AnexoItem';

export default function AnexoList({
    anexos = [],
    loading = false,
    onPreview,
    onDownload,
    onDelete,
    deletingId = null,
    emptyMessage = 'Nenhum anexo encontrado.',
    className = '',
}) {
    if (loading) {
        return (
            <div className={`flex items-center justify-center py-8 ${className}`}>
                <LoadingSpinner className="w-6 h-6 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Carregando anexos...
                </span>
            </div>
        );
    }

    if (!anexos || anexos.length === 0) {
        return (
            <div className={`text-center py-6 ${className}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <AnimatePresence mode="popLayout">
                {anexos.map((anexo) => (
                    <AnexoItem
                        key={anexo.id}
                        anexo={anexo}
                        onPreview={onPreview}
                        onDownload={onDownload}
                        onDelete={onDelete}
                        deleting={deletingId === anexo.id}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
