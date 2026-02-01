import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '@/Components/common/Modal';
import { XIcon, DownloadIcon, LoadingSpinner, getFileIcon, getFileIconColor } from './FileIcons';

export default function AnexoPreviewModal({
    isOpen,
    onClose,
    anexo,
    onDownload,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen && anexo) {
            setLoading(true);
            setError(false);
        }
    }, [isOpen, anexo]);

    if (!anexo) return null;

    const handleImageLoad = () => {
        setLoading(false);
    };

    const handleImageError = () => {
        setLoading(false);
        setError(true);
    };

    const handlePdfLoad = () => {
        setLoading(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="4xl"
            title={anexo.original_name}
        >
            <div className="space-y-4">
                <div className="relative min-h-[300px] max-h-[70vh] overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                            <LoadingSpinner className="w-8 h-8 text-gray-400" />
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
                            <span className={getFileIconColor(anexo.icon_type)}>
                                {getFileIcon(anexo.icon_type, 'w-16 h-16')}
                            </span>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Não foi possível carregar o preview.
                            </p>
                            <button
                                type="button"
                                onClick={() => onDownload?.(anexo)}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Baixar arquivo
                            </button>
                        </div>
                    )}

                    {anexo.is_image && (
                        <img
                            src={anexo.preview_url}
                            alt={anexo.original_name}
                            className={`mx-auto max-w-full h-auto ${loading ? 'invisible' : 'visible'}`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    )}

                    {anexo.is_pdf && (
                        <iframe
                            src={anexo.preview_url}
                            title={anexo.original_name}
                            className={`w-full h-[60vh] border-0 ${loading ? 'invisible' : 'visible'}`}
                            onLoad={handlePdfLoad}
                            onError={handleImageError}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                        <span>{anexo.formatted_size}</span>
                        <span>•</span>
                        <span>{anexo.extension?.toUpperCase()}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onDownload?.(anexo)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Baixar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
