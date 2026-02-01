import { apiService } from './api';

export const transactionService = {
    list: async (filters = {}, signal) => {
        const response = await apiService.get(
            route('transacoes.index'),
            filters,
            { signal }
        );
        return response.data;
    },

    get: async (id) => {
        const response = await apiService.get(route('transacoes.show', id));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('transacoes.store'), data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiService.put(route('transacoes.update', id), data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiService.delete(route('transacoes.destroy', id));
        return response.data;
    },

    restore: async (id) => {
        const response = await apiService.post(route('transacoes.restore', id));
        return response.data;
    },

    stats: async (filters = {}) => {
        const response = await apiService.get(route('transacoes.stats'), filters);
        return response.data;
    },

    export: async (filters = {}) => {
        const response = await apiService.get(
            route('transacoes.export_data'),
            filters
        );
        return response.data;
    },

    import: async (rows) => {
        const response = await apiService.post(route('transacoes.import'), { rows });
        return response.data;
    },

    payMonth: async (monthKey, bankUserId = null) => {
        const response = await apiService.post(route('transacoes.pay_month'), {
            month_key: monthKey,
            bank_user_id: bankUserId,
        });
        return response.data;
    },
};

export default transactionService;
