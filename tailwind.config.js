import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'bell-ring': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '15%': { transform: 'rotate(10deg)' },
                    '30%': { transform: 'rotate(-10deg)' },
                    '45%': { transform: 'rotate(5deg)' },
                    '60%': { transform: 'rotate(-5deg)' },
                    '75%': { transform: 'rotate(2deg)' },
                },
                'slide-in-top': {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            animation: {
                'bell-ring': 'bell-ring 0.9s ease-in-out both',
                'slide-in-top': 'slide-in-top 0.6s cubic-bezier(0.25,0.46,0.45,0.94) both',
                'spin-slow': 'spin 3s linear infinite',
            },
            colors: {
                theme: {
                    primary: 'var(--theme-primary)',
                    'primary-hover': 'var(--theme-primaryHover)',
                    'primary-light': 'var(--theme-primaryLight)',
                    'primary-ring': 'var(--theme-primaryRing)',
                    accent: 'var(--theme-accent)',
                    'accent-hover': 'var(--theme-accentHover)',
                    'accent-light': 'var(--theme-accentLight)',
                    'border-dark': 'var(--theme-borderDark)',
                    scrollbar: 'var(--theme-scrollbar)',
                    'scrollbar-dark': 'var(--theme-scrollbarDark)',
                },
            },
        },
    },

    plugins: [forms],
};
