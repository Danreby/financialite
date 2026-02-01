import { useState, useEffect, useCallback } from 'react';

const isBrowser = typeof window !== 'undefined';

const safeJsonParse = (value, fallback) => {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export function useLocalStorage(key, initialValue) {
    const getStoredValue = useCallback(() => {
        if (!isBrowser) {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item !== null ? safeJsonParse(item, initialValue) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    const [storedValue, setStoredValue] = useState(getStoredValue);

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            setStoredValue(valueToStore);

            if (isBrowser) {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                
                window.dispatchEvent(new StorageEvent('storage', {
                    key,
                    newValue: JSON.stringify(valueToStore),
                }));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            
            if (isBrowser) {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    useEffect(() => {
        if (!isBrowser) return;

        const handleStorageChange = (event) => {
            if (event.key === key && event.newValue !== null) {
                setStoredValue(safeJsonParse(event.newValue, initialValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

export function useSessionStorage(key, initialValue) {
    const getStoredValue = useCallback(() => {
        if (!isBrowser) {
            return initialValue;
        }

        try {
            const item = window.sessionStorage.getItem(key);
            return item !== null ? safeJsonParse(item, initialValue) : initialValue;
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    const [storedValue, setStoredValue] = useState(getStoredValue);

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (isBrowser) {
                window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
}

export default useLocalStorage;
