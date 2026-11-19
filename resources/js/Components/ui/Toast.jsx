import { ToastContainer } from 'react-toastify';
import { useTheme } from '@/Contexts/ThemeContext';

/**
 * ToastContainer com a configuração do app. O visual (superfície, borda,
 * raio, cores de estado) vem dos tokens em app.css (seção "Toasts").
 */
export const toastDefaults = {
    position: 'top-right',
    autoClose: 4000,
    newestOnTop: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export default function ToastHost(props) {
    const { resolvedMode } = useTheme();
    return <ToastContainer {...toastDefaults} theme={resolvedMode} {...props} />;
}
