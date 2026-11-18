import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Tokens em canais RGB (definidos em resources/css/app.css e, para o destaque,
// escritos pelo ThemeContext). O <alpha-value> faz `bg-theme-accent/10` funcionar.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const semantic = (name) => ({
    DEFAULT: token(name),
    strong: token(`${name}-strong`),
    soft: token(`${name}-soft`),
});

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
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
                surface: {
                    DEFAULT: token('surface-raised'),
                    base: token('surface-base'),
                    raised: token('surface-raised'),
                    sunken: token('surface-sunken'),
                },
                content: {
                    DEFAULT: token('content-primary'),
                    primary: token('content-primary'),
                    secondary: token('content-secondary'),
                    muted: token('content-muted'),
                    subtle: token('content-subtle'),
                },
                line: {
                    DEFAULT: token('line'),
                    strong: token('line-strong'),
                },
                success: semantic('success'),
                danger: semantic('danger'),
                warning: semantic('warning'),
                info: semantic('info'),
                // Destaque da paleta do usuário. Os nomes antigos (primary,
                // accent-light, border-dark...) continuam valendo e apontam
                // para os tokens novos.
                theme: {
                    accent: token('accent'),
                    'accent-hover': token('accent-hover'),
                    'accent-soft': token('accent-soft'),
                    'accent-text': token('accent-text'),
                    'accent-ring': token('accent-ring'),
                    'on-accent': token('on-accent'),
                    'accent-light': token('accent-soft'),
                    primary: token('accent-hover'),
                    'primary-hover': token('accent-hover'),
                    'primary-light': token('accent-soft'),
                    'primary-ring': token('accent-ring'),
                    'border-dark': token('line'),
                    scrollbar: token('line-strong'),
                    'scrollbar-dark': token('line-strong'),
                },
            },
            // Texto com a cor da paleta usa o tom que passa de 4,5:1 nos dois
            // modos; o `accent` puro fica para fundos (botão com texto branco).
            textColor: {
                theme: {
                    accent: token('accent-text'),
                    'accent-hover': token('accent-text'),
                    primary: token('accent-text'),
                },
            },
            // Anel de foco: no escuro troca para o tom claro (3:1 sobre grafite).
            ringColor: {
                theme: {
                    accent: token('accent-ring'),
                },
            },
            boxShadow: {
                card: 'var(--shadow-card)',
            },
            borderRadius: {
                card: '12px',
            },
        },
    },

    plugins: [forms],
};
