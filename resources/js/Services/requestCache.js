const DEFAULT_TTL = 30_000;
const DEFAULT_STALE_TTL = 60_000;
const MAX_ENTRIES = 100;

class RequestCache {
    constructor() {
        /** @type {Map<string, { data: any, expiresAt: number, staleUntil: number }>} */
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

    _getEntry(url, params) {
        const key = this._buildKey(url, params);
        const entry = this._cache.get(key);
        if (!entry) return null;

        const now = Date.now();

        if (now < entry.expiresAt) {
            return { data: entry.data, isStale: false };
        }

        if (now < entry.staleUntil) {
            return { data: entry.data, isStale: true };
        }

        this._cache.delete(key);
        return null;
    }

    get(url, params) {
        const entry = this._getEntry(url, params);
        return entry ? entry.data : null;
    }

    set(url, params, data, ttl = DEFAULT_TTL, staleTtl = DEFAULT_STALE_TTL) {
        const key = this._buildKey(url, params);

        if (this._cache.size >= MAX_ENTRIES) {
            const oldestKey = this._cache.keys().next().value;
            this._cache.delete(oldestKey);
        }

        const now = Date.now();
        this._cache.set(key, {
            data,
            expiresAt: now + ttl,
            staleUntil: now + ttl + staleTtl,
        });
    }

    async dedup(url, params, fetcher, ttl = DEFAULT_TTL, staleTtl = DEFAULT_STALE_TTL) {
        const entry = this._getEntry(url, params);

        if (entry && !entry.isStale) {
            return entry.data;
        }

        const key = this._buildKey(url, params);

        if (entry && entry.isStale) {
            if (!this._inflight.has(key)) {
                const bgPromise = fetcher()
                    .then((data) => {
                        this.set(url, params, data, ttl, staleTtl);
                        this._inflight.delete(key);
                        return data;
                    })
                    .catch(() => {
                        this._inflight.delete(key);
                    });

                this._inflight.set(key, bgPromise);
            }

            return entry.data;
        }

        if (this._inflight.has(key)) {
            return this._inflight.get(key);
        }

        const promise = fetcher()
            .then((data) => {
                this.set(url, params, data, ttl, staleTtl);
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

        for (const key of this._inflight.keys()) {
            if (key.startsWith(prefix) || key.includes(prefix)) {
                this._inflight.delete(key);
            }
        }
    }

    invalidate(url, params) {
        const key = this._buildKey(url, params);
        this._cache.delete(key);
        this._inflight.delete(key);
    }

    clear() {
        this._cache.clear();
        this._inflight.clear();
    }
}

export const requestCache = new RequestCache();

export default requestCache;

