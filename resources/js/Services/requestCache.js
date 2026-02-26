const DEFAULT_TTL = 30_000;
const MAX_ENTRIES = 100;

class RequestCache {
    constructor() {
        /** @type {Map<string, { data: any, expiresAt: number }>} */
        this._cache = new Map();
        /** @type {Map<string, Promise<any>>} */
        this._inflight = new Map();
    }

    _buildKey(url, params = {}) {
        const filtered = Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .sort(([a], [b]) => a.localeCompare(b));
        const qs = filtered.map(([k, v]) => `${k}=${v}`).join('&');
        return qs ? `${url}?${qs}` : url;
    }

    get(url, params) {
        const key = this._buildKey(url, params);
        const entry = this._cache.get(key);
        if (entry && Date.now() < entry.expiresAt) {
            return entry.data;
        }
        if (entry) {
            this._cache.delete(key);
        }
        return null;
    }

    set(url, params, data, ttl = DEFAULT_TTL) {
        const key = this._buildKey(url, params);

        if (this._cache.size >= MAX_ENTRIES) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
        }

        this._cache.set(key, {
            data,
            expiresAt: Date.now() + ttl,
        });
    }

    async dedup(url, params, fetcher, ttl = DEFAULT_TTL) {
        const cached = this.get(url, params);
        if (cached !== null) {
            return cached;
        }

        const key = this._buildKey(url, params);

        if (this._inflight.has(key)) {
            return this._inflight.get(key);
        }

        const promise = fetcher()
            .then((data) => {
                this.set(url, params, data, ttl);
                this._inflight.delete(key);
                return data;
            })
            .catch((err) => {
                this._inflight.delete(key);
                throw err;
            });

        this._inflight.set(key, promise);
        return promise;
    }

    invalidateByPrefix(prefix) {
        for (const key of this._cache.keys()) {
            if (key.startsWith(prefix) || key.includes(prefix)) {
                this._cache.delete(key);
            }
        }
    }

    invalidate(url, params) {
        const key = this._buildKey(url, params);
        this._cache.delete(key);
    }

    clear() {
        this._cache.clear();
        this._inflight.clear();
    }
}

export const requestCache = new RequestCache();

export default requestCache;
