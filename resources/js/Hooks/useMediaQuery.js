import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
};

export function useMediaQuery(query) {
    const mediaQuery = BREAKPOINTS[query] || query;

    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(mediaQuery).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQueryList = window.matchMedia(mediaQuery);

        const handleChange = (event) => {
            setMatches(event.matches);
        };

        setMatches(mediaQueryList.matches);

        if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener('change', handleChange);
            return () => mediaQueryList.removeEventListener('change', handleChange);
        }
        
        mediaQueryList.addListener(handleChange);
        return () => mediaQueryList.removeListener(handleChange);
    }, [mediaQuery]);

    return matches;
}

export function usePrefersReducedMotion() {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function usePrefersDarkMode() {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

export function useBreakpoints() {
    return {
        isSm: useMediaQuery('sm'),
        isMd: useMediaQuery('md'),
        isLg: useMediaQuery('lg'),
        isXl: useMediaQuery('xl'),
        is2xl: useMediaQuery('2xl'),
        isMobile: !useMediaQuery('md'),
        isTablet: useMediaQuery('md') && !useMediaQuery('lg'),
        isDesktop: useMediaQuery('lg'),
    };
}

export default useMediaQuery;
