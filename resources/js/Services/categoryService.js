import { apiService } from './api';

export const categoryService = {
    list: async () => {
        const response = await apiService.get(route('categories.index'));
        return response.data;
    },

    create: async (data) => {
        const response = await apiService.post(route('categories.store'), data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiService.put(route('categories.update', id), data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiService.delete(route('categories.destroy', id));
        return response.data;
    },
};

export default categoryService;
