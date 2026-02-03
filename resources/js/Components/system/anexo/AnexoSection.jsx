import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CompactFileUpload from './CompactFileUpload';
import AnexoList from './AnexoList';
import AnexoPreviewModal from './AnexoPreviewModal';
import { PaperclipIcon } from '../../common/icons/FileIcons';

export default function AnexoSection({
    transacaoId,
    className = '',
}) {
    const [anexos, setAnexos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [previewAnexo, setPreviewAnexo] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true); // Inicia expandido por padrão

    const loadAnexos = useCallback(async () => {
        if (!transacaoId) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(route('transacoes.anexos', transacaoId));
            setAnexos(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar anexos:', error);
            if (error.response?.status !== 404) {
                toast.error('Erro ao carregar anexos.');
            }
        } finally {
            setLoading(false);
        }
    }, [transacaoId]);

    useEffect(() => {
        loadAnexos();
    }, [loadAnexos]);

    const handleUpload = useCallback(async (formData) => {
        try {
            formData.append('transacao_id', transacaoId);
            
            const response = await axios.post(route('anexos.store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success(response.data.message || 'Arquivo enviado com sucesso!');
            await loadAnexos();
        } catch (error) {
            console.error('Erro no upload:', error);
            const message = error.response?.data?.message || 'Erro ao enviar arquivo.';
            toast.error(message);
            throw error;
        }
    }, [transacaoId, loadAnexos]);

    const handlePreview = useCallback((anexo) => {
        setPreviewAnexo(anexo);
    }, []);

    const handleDownload = useCallback((anexo) => {
        window.open(route('anexos.download', anexo.id), '_blank');
    }, []);

    const handleDelete = useCallback(async (anexo) => {
        if (!confirm(`Deseja realmente remover o anexo "${anexo.original_name}"?`)) {
            return;
        }

        setDeletingId(anexo.id);
        try {
            await axios.delete(route('anexos.destroy', anexo.id));
            toast.success('Anexo removido com sucesso!');
            setAnexos((prev) => prev.filter((a) => a.id !== anexo.id));
        } catch (error) {
            console.error('Erro ao deletar anexo:', error);
            toast.error('Erro ao remover anexo.');
        } finally {
            setDeletingId(null);
        }
    }, []);

    return (
        <div className={`space-y-4 ${className}`}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                        <PaperclipIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Anexos
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {loading
                                ? 'Carregando...'
                                : anexos.length === 0
                                ? 'Nenhum anexo'
                                : `${anexos.length} arquivo${anexos.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>

                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="space-y-4 pt-2">
                    {anexos.length > 0 && (
                        <>
                            <AnexoList
                                anexos={anexos}
                                loading={loading}
                                onPreview={handlePreview}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                deletingId={deletingId}
                            />

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Adicionar novos anexos
                                </p>
                                <CompactFileUpload
                                    onUpload={handleUpload}
                                    transacaoId={transacaoId}
                                    multiple={true}
                                />
                            </div>
                        </>
                    )}

                    {anexos.length === 0 && !loading && (
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Adicionar anexos
                            </p>
                            <CompactFileUpload
                                onUpload={handleUpload}
                                transacaoId={transacaoId}
                                multiple={true}
                            />
                        </div>
                    )}
                </div>
            )}

            <AnexoPreviewModal
                isOpen={previewAnexo !== null}
                onClose={() => setPreviewAnexo(null)}
                anexo={previewAnexo}
                onDownload={handleDownload}
            />
        </div>
    );
}
