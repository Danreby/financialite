import { useState, useEffect, useCallback, useRef } from 'react';
import { createAbortController } from '../Services/api';

export function useApi(apiFunction, options = {}) {
    const {
        immediate = false,
        initialData = null,
        onSuccess,
        onError,
        deps = [],
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const abortControllerRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        
        return () => {
            mountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const execute = useCallback(async (...args) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = createAbortController();

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(...args, abortControllerRef.current.signal);

            if (mountedRef.current) {
                setData(result);
                setLoading(false);

                if (onSuccess) {
                    onSuccess(result);
                }
            }

            return result;
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }

            if (mountedRef.current) {
                const normalizedError = err.normalized || {
                    message: err.message || 'Erro desconhecido',
                    type: 'UNKNOWN',
                };

                setError(normalizedError);
                setLoading(false);

                if (onError) {
                    onError(normalizedError);
                }
            }

            throw err;
        }
    }, [apiFunction, onSuccess, onError]);

    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setLoading(false);
    }, [initialData]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, ...deps]);

    return {
        data,
        loading,
        error,
        execute,
        reset,
        setData,
    };
}

export function usePaginatedApi(apiFunction, options = {}) {
    const {
        initialData = [],
        pageSize = 15,
        onSuccess,
        onError,
    } = options;

    const [data, setData] = useState(initialData);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const abortControllerRef = useRef(null);

    const loadPage = useCallback(async (pageNum, filters = {}, append = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = createAbortController();

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction(
                pageNum,
                filters,
                abortControllerRef.current.signal
            );

            const items = result.data || result;
            const total = result.total || result.meta?.total;

            if (append) {
                setData((prev) => [...prev, ...items]);
            } else {
                setData(items);
            }

            setPage(pageNum);
            setHasMore(items.length >= pageSize && (!total || data.length + items.length < total));
            setLoading(false);

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }

            setError(err.normalized || { message: err.message });
            setLoading(false);

            if (onError) {
                onError(err);
            }

            throw err;
        }
    }, [apiFunction, pageSize, onSuccess, onError]);

    const loadMore = useCallback((filters = {}) => {
        if (!loading && hasMore) {
            return loadPage(page + 1, filters, true);
        }
    }, [loading, hasMore, page, loadPage]);

    const refresh = useCallback((filters = {}) => {
        setPage(1);
        setHasMore(true);
        return loadPage(1, filters, false);
    }, [loadPage]);

    const reset = useCallback(() => {
        setData(initialData);
        setPage(1);
        setHasMore(true);
        setError(null);
        setLoading(false);
    }, [initialData]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        page,
        hasMore,
        loadPage,
        loadMore,
        refresh,
        reset,
        setData,
    };
}

export default useApi;
