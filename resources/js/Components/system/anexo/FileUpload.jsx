import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { UploadIcon, XIcon, LoadingSpinner, getFileIcon, getFileIconColor } from '../../common/icons/FileIcons';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getIconTypeFromFile(file) {
    const mimeType = file.type;

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'text/csv'
    ) {
        return 'spreadsheet';
    }
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return 'document';
    }

    return 'file';
}

function validateFile(file) {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        return `Tipo de arquivo não permitido: ${extension}. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    if (file.size > MAX_FILE_SIZE) {
        return `Arquivo muito grande: ${formatFileSize(file.size)}. Máximo: ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    return null;
}

export default function FileUpload({
    onUpload,
    transacaoId = null,
    multiple = true,
    disabled = false,
    className = '',
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const processFiles = useCallback((files) => {
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            } else {
                validFiles.push({
                    file,
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                    iconType: getIconTypeFromFile(file),
                });
            }
        });

        if (errors.length > 0) {
            toast.error(errors.join('\n'));
        }

        if (!multiple && validFiles.length > 1) {
            toast.warning('Apenas um arquivo pode ser enviado por vez.');
            return [validFiles[0]];
        }

        if (validFiles.length > MAX_FILES) {
            toast.warning(`Máximo de ${MAX_FILES} arquivos por vez.`);
            return validFiles.slice(0, MAX_FILES);
        }

        return validFiles;
    }, [multiple]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const processed = processFiles(files);
            setSelectedFiles((prev) => {
                const newFiles = multiple ? [...prev, ...processed] : processed;
                return newFiles.slice(0, MAX_FILES);
            });
        }
    }, [disabled, multiple, processFiles]);

    const handleFileSelect = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const processed = processFiles(files);
            setSelectedFiles((prev) => {
                const newFiles = multiple ? [...prev, ...processed] : processed;
                return newFiles.slice(0, MAX_FILES);
            });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [multiple, processFiles]);

    const handleRemoveFile = useCallback((id) => {
        setSelectedFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    const handleUpload = useCallback(async () => {
        if (selectedFiles.length === 0 || uploading) return;

        setUploading(true);

        try {
            const formData = new FormData();

            if (selectedFiles.length === 1) {
                formData.append('file', selectedFiles[0].file);
            } else {
                selectedFiles.forEach((item) => {
                    formData.append('files[]', item.file);
                });
            }

            if (transacaoId) {
                formData.append('transacao_id', transacaoId);
            }

            await onUpload(formData);

            selectedFiles.forEach((item) => {
                if (item.preview) {
                    URL.revokeObjectURL(item.preview);
                }
            });
            setSelectedFiles([]);
        } catch (error) {
            console.error('Erro no upload:', error);
        } finally {
            setUploading(false);
        }
    }, [selectedFiles, uploading, transacaoId, onUpload]);

    const handleClearAll = useCallback(() => {
        selectedFiles.forEach((item) => {
            if (item.preview) {
                URL.revokeObjectURL(item.preview);
            }
        });
        setSelectedFiles([]);
    }, [selectedFiles]);

    return (
        <div className={`space-y-3 ${className}`}>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
                className={`
                    relative flex flex-col items-center justify-center 
                    border-2 border-dashed rounded-xl p-6 cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isDragging
                        ? 'border-theme-accent bg-theme-accent-light'
                        : 'border-gray-300 dark:border-gray-600 hover:border-theme-accent dark:hover:border-theme-accent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="hidden"
                />

                <UploadIcon
                    className={`w-10 h-10 mb-3 transition-colors ${
                        isDragging ? 'text-theme-accent' : 'text-gray-400 dark:text-gray-500'
                    }`}
                />

                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {ALLOWED_EXTENSIONS.slice(0, 5).join(', ')}... (máx. {formatFileSize(MAX_FILE_SIZE)})
                </p>
            </div>

            <AnimatePresence mode="popLayout">
                {selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {selectedFiles.length} arquivo(s) selecionado(s)
                            </span>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                Limpar todos
                            </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-custom">
                            {selectedFiles.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {item.preview ? (
                                            <img
                                                src={item.preview}
                                                alt={item.file.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className={getFileIconColor(item.iconType)}>
                                                {getFileIcon(item.iconType, 'w-5 h-5')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                            {item.file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(item.file.size)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(item.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading || selectedFiles.length === 0}
                            className={`
                                w-full flex items-center justify-center gap-2 px-4 py-2.5 
                                rounded-lg text-sm font-semibold transition-all
                                ${uploading || selectedFiles.length === 0
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-theme-accent hover:bg-theme-accent-hover text-white shadow-md hover:shadow-lg'
                                }
                            `}
                        >
                            {uploading ? (
                                <>
                                    <LoadingSpinner className="w-4 h-4" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-4 h-4" />
                                    Enviar {selectedFiles.length > 1 ? 'arquivos' : 'arquivo'}
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
