import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    ThemeProvider,
    applyAppearance,
    readInitialAppearance,
    resolveMode,
    useTheme,
} from './Contexts/ThemeContext';

function ThemedToasts() {
    const { resolvedMode } = useTheme();

    return (
        <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme={resolvedMode}
        />
    );
}

const appName = import.meta.env.VITE_APP_NAME || 'Financialite';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const initialUser = props.initialPage?.props?.auth?.user ?? null;

        // Aplica paleta e modo antes do primeiro render para não piscar.
        const { palette, colorMode } = readInitialAppearance(initialUser);
        applyAppearance(palette, resolveMode(colorMode));

        createRoot(el).render(
            <ThemeProvider initialUser={initialUser}>
                <App {...props} />
                <ThemedToasts />
            </ThemeProvider>,
        );
    },
    progress: {
        color: 'rgb(var(--accent))',
    },
});
