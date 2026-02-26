import { apiService } from './api';
import requestCache from './requestCache';

// Fresh for 20s, then stale-while-revalidate for another 40s.
// The backend also has a 15s HTTP cache (cache.api:15) so the net
// effect is at most one API request per 15s even without client caching.
const DASHBOARD_CACHE_TTL = 20_000;
const DASHBOARD_STALE_TTL = 40_000;

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
        }, DASHBOARD_CACHE_TTL, DASHBOARD_STALE_TTL);
    },

    invalidateCache: () => {
        requestCache.invalidateByPrefix('dashboard');
    },
};

export default dashboardService;

