import { apiService } from './api';

export const anexoService = {
    list: async (filters = {}, signal) => {
        const response = await apiService.get(
            route('anexos.index'),
            filters,
            { signal }
        );
        return response.data;
    },

    stats: async () => {
        const response = await apiService.get(route('anexos.stats'));
        return response.data;
    },

    upload: async (file, { transacaoId, description, onProgress, signal } = {}) => {
        const formData = new FormData();
        formData.append('file', file);
        
        if (transacaoId) {
            formData.append('transacao_id', transacaoId);
        }
        if (description) {
            formData.append('description', description);
        }

        const response = await apiService.upload(
            route('anexos.store'),
            formData,
            onProgress,
            signal
        );
        return response.data;
    },

    uploadMultiple: async (files, options = {}) => {
        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                const result = await anexoService.upload(file, options);
                results.push(result);
            } catch (error) {
                errors.push({ file: file.name, error });
            }
        }

        return { results, errors };
    },

    update: async (id, data) => {
        const response = await apiService.patch(route('anexos.update', id), data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiService.delete(route('anexos.destroy', id));
        return response.data;
    },

    download: async (id, filename) => {
        return apiService.download(route('anexos.download', id), filename);
    },

    getPreviewUrl: (id) => route('anexos.preview', id),

    attachToTransaction: async (anexoId, transacaoId) => {
        const response = await apiService.post(route('anexos.attach'), {
            anexo_id: anexoId,
            transacao_id: transacaoId,
        });
        return response.data;
    },

    detachFromTransaction: async (anexoId, transacaoId) => {
        const response = await apiService.delete(
            route('anexos.detach', { anexoId, transacaoId })
        );
        return response.data;
    },

    listForTransaction: async (transacaoId) => {
        const response = await apiService.get(
            route('transacoes.anexos', transacaoId)
        );
        return response.data;
    },
};

export default anexoService;
