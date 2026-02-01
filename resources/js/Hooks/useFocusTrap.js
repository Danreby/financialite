import { useEffect, useRef, useCallback } from 'react';

const getFocusableElements = (container) => {
    if (!container) return [];

    const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)).filter(
        (el) => !el.closest('[inert]') && el.offsetParent !== null
    );
};

export function useFocusTrap(active, options = {}) {
    const {
        returnFocusOnDeactivate = true,
        escapeDeactivates = true,
        onEscape,
        initialFocus = true,
    } = options;

    const containerRef = useRef(null);
    const previousFocusRef = useRef(null);

    const handleKeyDown = useCallback((event) => {
        if (!active || !containerRef.current) return;

        if (event.key === 'Escape' && escapeDeactivates) {
            event.preventDefault();
            if (onEscape) {
                onEscape();
            }
            return;
        }

        if (event.key === 'Tab') {
            const focusableElements = getFocusableElements(containerRef.current);

            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
                return;
            }

            if (!containerRef.current.contains(document.activeElement)) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, [active, escapeDeactivates, onEscape]);

    useEffect(() => {
        if (!active) return;

        previousFocusRef.current = document.activeElement;

        if (initialFocus && containerRef.current) {
            const focusableElements = getFocusableElements(containerRef.current);
            if (focusableElements.length > 0) {
                setTimeout(() => {
                    focusableElements[0].focus();
                }, 0);
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            if (returnFocusOnDeactivate && previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [active, handleKeyDown, initialFocus, returnFocusOnDeactivate]);

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const handleFocusIn = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                const focusableElements = getFocusableElements(containerRef.current);
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        };

        document.addEventListener('focusin', handleFocusIn);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
        };
    }, [active]);

    return { containerRef };
}

export function useScrollLock(locked) {
    useEffect(() => {
        if (!locked) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [locked]);
}

export default useFocusTrap;
