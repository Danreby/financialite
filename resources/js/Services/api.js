import axios from 'axios';

export const API_ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION: 'VALIDATION_ERROR',
    CSRF_MISMATCH: 'CSRF_MISMATCH',
    SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',
    UNKNOWN: 'UNKNOWN_ERROR',
};

const DEFAULT_CONFIG = {
    timeout: 30000,
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
};

const api = axios.create({
    baseURL: '/',
    ...DEFAULT_CONFIG,
});

const errorListeners = new Set();
const authListeners = new Set();

export const onApiError = (callback) => {
    errorListeners.add(callback);
    return () => errorListeners.delete(callback);
};

export const onAuthEvent = (callback) => {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
};

const notifyErrorListeners = (error) => {
    errorListeners.forEach((callback) => {
        try {
            callback(error);
        } catch (e) {
            console.error('Error in API error listener:', e);
        }
    });
};

const notifyAuthListeners = (event) => {
    authListeners.forEach((callback) => {
        try {
            callback(event);
        } catch (e) {
            console.error('Error in auth listener:', e);
        }
    });
};

const normalizeError = (error) => {
    if (!error.response) {
        if (error.code === 'ECONNABORTED') {
            return {
                type: API_ERROR_TYPES.TIMEOUT,
                message: 'A requisição excedeu o tempo limite. Tente novamente.',
                status: null,
                data: null,
            };
        }
        return {
            type: API_ERROR_TYPES.NETWORK,
            message: 'Erro de conexão. Verifique sua internet.',
            status: null,
            data: null,
        };
    }

    const { status, data } = error.response;

    switch (status) {
        case 401:
            return {
                type: API_ERROR_TYPES.UNAUTHORIZED,
                message: data?.message || 'Sessão expirada. Faça login novamente.',
                status,
                data,
            };
        case 403:
            return {
                type: API_ERROR_TYPES.FORBIDDEN,
                message: data?.message || 'Você não tem permissão para esta ação.',
                status,
                data,
            };
        case 404:
            return {
                type: API_ERROR_TYPES.NOT_FOUND,
                message: data?.message || 'Recurso não encontrado.',
                status,
                data,
            };
        case 419:
            return {
                type: API_ERROR_TYPES.CSRF_MISMATCH,
                message: 'Sessão expirada. Recarregue a página.',
                status,
                data,
            };
        case 422:
            return {
                type: API_ERROR_TYPES.VALIDATION,
                message: data?.message || 'Dados inválidos.',
                status,
                data,
                errors: data?.errors || {},
            };
        case 429:
            return {
                type: API_ERROR_TYPES.TIMEOUT,
                message: 'Muitas requisições. Aguarde um momento.',
                status,
                data,
            };
        case 500:
        case 502:
        case 503:
        case 504:
            return {
                type: API_ERROR_TYPES.SERVER_ERROR,
                message: 'Erro no servidor. Tente novamente mais tarde.',
                status,
                data,
            };
        default:
            return {
                type: API_ERROR_TYPES.UNKNOWN,
                message: data?.message || 'Ocorreu um erro inesperado.',
                status,
                data,
            };
    }
};

api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalizedError = normalizeError(error);

        if (normalizedError.type === API_ERROR_TYPES.UNAUTHORIZED) {
            notifyAuthListeners('session_expired');
        }

        if (normalizedError.type === API_ERROR_TYPES.CSRF_MISMATCH) {
            notifyAuthListeners('csrf_mismatch');
        }

        notifyErrorListeners(normalizedError);

        error.normalized = normalizedError;

        return Promise.reject(error);
    }
);

export const apiService = {
    get: (url, params = {}, config = {}) => 
        api.get(url, { params, ...config }),

    post: (url, data = {}, config = {}) => 
        api.post(url, data, config),

    put: (url, data = {}, config = {}) => 
        api.put(url, data, config),

    patch: (url, data = {}, config = {}) => 
        api.patch(url, data, config),

    delete: (url, config = {}) => 
        api.delete(url, config),

    upload: (url, formData, onProgress, signal) => 
        api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percent);
                }
            },
            signal,
        }),

    download: async (url, filename) => {
        const response = await api.get(url, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return response;
    },
};

export const createAbortController = () => new AbortController();

export default api;
