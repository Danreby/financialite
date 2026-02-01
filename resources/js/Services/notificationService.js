import { apiService } from './api';

export const notificationService = {
    list: async (filters = {}) => {
        const response = await apiService.get(route('notifications.index'), filters);
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await apiService.patch(
            route('notifications.read', id)
        );
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await apiService.post(route('notifications.read-all'));
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await apiService.get(route('notifications.unread-count'));
        return response.data?.count ?? 0;
    },
};

export default notificationService;
