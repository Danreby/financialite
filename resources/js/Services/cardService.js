import { apiService } from './api';

export const cardService = {
    list: async () => {
        const response = await apiService.get(route('cards.index'));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('cards.store'), data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiService.put(route('cards.update', id), data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiService.delete(route('cards.destroy', id));
        return response.data;
    },

    attach: async (data) => {
        const response = await apiService.post(route('cards.attach'), data);
        return response.data;
    },

    detach: async (cardUserId) => {
        const response = await apiService.delete(
            route('card-users.destroy', cardUserId)
        );
        return response.data;
    },

    updateDueDay: async (cardUserId, dueDay) => {
        const response = await apiService.patch(
            route('card-users.update', cardUserId),
            { due_day: dueDay }
        );
        return response.data;
    },
};

export default cardService;
