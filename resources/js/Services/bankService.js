import { apiService } from './api';

export const bankService = {
    list: async () => {
        const response = await apiService.get(route('banks.index'));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('banks.store'), data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiService.put(route('banks.update', id), data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiService.delete(route('banks.destroy', id));
        return response.data;
    },

    attach: async (data) => {
        const response = await apiService.post(route('banks.attach'), data);
        return response.data;
    },

    detach: async (bankUserId) => {
        const response = await apiService.delete(
            route('bank-users.destroy', bankUserId)
        );
        return response.data;
    },

    updateDueDay: async (bankUserId, dueDay) => {
        const response = await apiService.patch(
            route('bank-users.update', bankUserId),
            { due_day: dueDay }
        );
        return response.data;
    },
};

export default bankService;
