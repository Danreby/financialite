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
