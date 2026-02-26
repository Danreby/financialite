/**
 * In-memory request cache with:
 * - Deduplication of in-flight requests
 * - TTL-based expiry
 * - Stale-while-revalidate: return stale data immediately and refresh in background
 *
 * This avoids blocking the UI while refreshing data that is slightly outdated,
 * significantly reducing perceived latency and the number of serial blocking requests.
 */

const DEFAULT_TTL = 30_000;
const DEFAULT_STALE_TTL = 60_000; // how long stale data is still usable for SWR
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

    /**
     * Returns { data, isStale } or null when there is no usable cached entry.
     */
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

        // Fully expired — evict
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

    /**
     * Deduplicated fetch with stale-while-revalidate:
     *
     * 1. Fresh cache hit  → return immediately, no network request.
     * 2. Stale cache hit  → return stale data immediately AND trigger a
     *                       background refresh (no blocking wait for caller).
     * 3. No cache / fully expired → fetch, block, cache result, return.
     *
     * @param {string}   url
     * @param {object}   params
     * @param {function} fetcher  async function that performs the actual request
     * @param {number}   ttl      milliseconds until data is considered stale
     * @param {number}   staleTtl additional milliseconds stale data is still usable
     */
    async dedup(url, params, fetcher, ttl = DEFAULT_TTL, staleTtl = DEFAULT_STALE_TTL) {
        const entry = this._getEntry(url, params);

        if (entry && !entry.isStale) {
            // Fresh — return immediately
            return entry.data;
        }

        const key = this._buildKey(url, params);

        if (entry && entry.isStale) {
            // Stale-while-revalidate: serve stale data now, refresh in background.
            // Only kick off a background refresh if one is not already in-flight.
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

        // No usable cache — if a request is already in-flight, wait for it.
        if (this._inflight.has(key)) {
            return this._inflight.get(key);
        }

        // Fresh fetch — block the caller until the request completes.
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

        // Also cancel any in-flight requests matching the prefix so a fresh
        // request is started on the next call rather than attaching to a
        // now-stale in-flight promise.
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

