import { apiService } from './api';
import requestCache from './requestCache';

const DASHBOARD_CACHE_TTL = 15_000;

export const dashboardService = {
    getData: async (filters = {}, page = 1) => {
        const params = {
            ...filters,
            page,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        );

        const url = route('dashboard.data');

        return requestCache.dedup(url, cleanParams, async () => {
            const response = await apiService.get(url, cleanParams);
            return response.data;
        }, DASHBOARD_CACHE_TTL);
    },

    invalidateCache: () => {
        requestCache.invalidateByPrefix('dashboard');
    },
};

export default dashboardService;
