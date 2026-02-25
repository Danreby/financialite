import { apiService } from './api';

export const bankAccountService = {
    list: async () => {
        const response = await apiService.get(route('bank-accounts.index'));
        return response.data;
    },

    stats: async () => {
        const response = await apiService.get(route('bank-accounts.stats'));
        return response.data;
    },

    show: async (bankUserId) => {
        const response = await apiService.get(route('bank-accounts.show', bankUserId));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('bank-accounts.store'), data);
        return response.data;
    },

    update: async (bankUserId, data) => {
        const response = await apiService.patch(route('bank-accounts.update', bankUserId), data);
        return response.data;
    },

    delete: async (bankUserId) => {
        const response = await apiService.delete(route('bank-accounts.destroy', bankUserId));
        return response.data;
    },
};

export const bankTransferService = {
    list: async () => {
        const response = await apiService.get(route('bank-transfers.index'));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('bank-transfers.store'), data);
        return response.data;
    },
};

export default bankAccountService;
