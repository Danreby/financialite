import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { UploadIcon, XIcon, LoadingSpinner, getFileIcon, getFileIconColor, PaperclipIcon } from '../../common/icons/FileIcons';

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
        return `Tipo de arquivo não permitido: ${extension}`;
    }

    if (file.size > MAX_FILE_SIZE) {
        return `Arquivo muito grande (máx. ${formatFileSize(MAX_FILE_SIZE)})`;
    }

    return null;
}

export default function CompactFileUpload({
    onUpload,
    transacaoId = null,
    multiple = true,
    disabled = false,
    className = '',
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

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
        }

        if (!multiple && validFiles.length > 1) {
            return [validFiles[0]];
        }

        if (validFiles.length > MAX_FILES) {
            toast.warning(`Máximo de ${MAX_FILES} arquivos por vez.`);
            return validFiles.slice(0, MAX_FILES);
        }

        return validFiles;
    }, [multiple]);

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
        
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

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
            if (processed.length > 0) {
                setShowFiles(true);
            }
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
            if (processed.length > 0) {
                setShowFiles(true);
            }
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
            const newFiles = prev.filter((f) => f.id !== id);
            if (newFiles.length === 0) {
                setShowFiles(false);
            }
            return newFiles;
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
            setShowFiles(false);
        } catch (error) {
            console.error('Erro no upload:', error);
        } finally {
            setUploading(false);
        }
    }, [selectedFiles, uploading, transacaoId, onUpload]);

    return (
        <div className={`space-y-2 ${className}`}>
            <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                    relative rounded-lg border-2 border-dashed transition-all
                    ${isDragging
                        ? 'border-theme-accent bg-theme-accent-light'
                        : 'border-gray-300 dark:border-gray-600 hover:border-theme-accent dark:hover:border-theme-accent'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple={multiple}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    className="hidden"
                />

                <div className="flex items-center justify-between gap-1.5 sm:gap-3 p-1.5 sm:p-3">
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                        <div className={`
                            flex-shrink-0 p-1 sm:p-2 rounded sm:rounded-lg transition-colors
                            ${isDragging 
                                ? 'bg-theme-accent-light' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }
                        `}>
                            <PaperclipIcon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${
                                isDragging 
                                    ? 'text-theme-accent' 
                                    : 'text-gray-500 dark:text-gray-400'
                            }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                                {selectedFiles.length > 0 
                                    ? `${selectedFiles.length} arquivo${selectedFiles.length > 1 ? 's' : ''}`
                                    : isDragging 
                                        ? 'Solte aqui'
                                        : 'Anexar arquivo'
                                }
                            </p>
                            <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block leading-tight mt-0.5">
                                {ALLOWED_EXTENSIONS.slice(0, 4).join(', ')}... (máx. {formatFileSize(MAX_FILE_SIZE)})
                            </p>
                            <p className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400 truncate sm:hidden leading-tight mt-0.5">
                                JPG, PNG, PDF... (máx. 10MB)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
                        {selectedFiles.length > 0 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFiles(!showFiles);
                                    }}
                                    className="p-1 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded sm:rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title={showFiles ? 'Ocultar arquivos' : 'Ver arquivos'}
                                >
                                    <svg
                                        className={`w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform  ${showFiles ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className={`
                                        flex items-center gap-0.5 sm:gap-1.5 px-1.5 py-1 sm:px-3 sm:py-2 rounded sm:rounded-lg text-[10px] sm:text-sm font-medium transition-all
                                        ${uploading
                                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-theme-accent hover:bg-theme-accent-hover text-white'
                                        }
                                    `}
                                >
                                    {uploading ? (
                                        <>
                                            <LoadingSpinner className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Enviando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Enviar</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                        
                        {selectedFiles.length === 0 && (
                            <button
                                type="button"
                                onClick={() => !disabled && fileInputRef.current?.click()}
                                disabled={disabled}
                                className="px-2 py-1 sm:px-4 sm:py-2 bg-theme-accent hover:bg-theme-accent-hover text-white text-[10px] sm:text-sm font-medium rounded sm:rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Selecionar</span>
                                <span className="sm:hidden">+</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showFiles && selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1 p-1 sm:p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg max-h-24 sm:max-h-40 overflow-y-auto scrollbar-custom">
                            {selectedFiles.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-2 bg-white dark:bg-gray-800 rounded group hover:bg-gray-50 dark:hover:bg-gray-800/80"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {item.preview ? (
                                            <img
                                                src={item.preview}
                                                alt={item.file.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className={getFileIconColor(item.iconType)}>
                                                {getFileIcon(item.iconType, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 truncate leading-tight">
                                            {item.file.name}
                                        </p>
                                        <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                            {formatFileSize(item.file.size)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(item.id)}
                                        className="flex-shrink-0 p-0.5 sm:p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remover arquivo"
                                    >
                                        <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
