import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiLoadPromise = null;

function loadGsi() {
    if (gsiLoadPromise) return gsiLoadPromise;

    gsiLoadPromise = new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = GSI_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            gsiLoadPromise = null;
            reject(new Error('Falha ao carregar o Google Sign-In.'));
        };
        document.head.appendChild(script);
    });

    return gsiLoadPromise;
}

export default function useGoogleAuth(mode = 'login') {
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef(null);
    const initializedRef = useRef(false);
    const modeRef = useRef(mode);
    modeRef.current = mode;

    const handleCredentialResponse = useCallback(async (response) => {
        if (!response?.credential) {
            setIsLoading(false);
            toast.error('Nenhuma credencial recebida do Google.');
            return;
        }

        try {
            const endpoint = modeRef.current === 'link'
                ? route('google.link')
                : route('google.token');

            const { data } = await axios.post(endpoint, { credential: response.credential });

            if (modeRef.current === 'login' && data?.redirect) {
                toast.success('Login com Google realizado!');
                window.location.href = data.redirect;
                return;
            }

            if (modeRef.current === 'link') {
                toast.success(data?.message || 'Conta Google vinculada!');
                router.reload({ only: ['auth'] });
            }
        } catch (error) {
            const status = error?.response?.status;
            const backendMsg = error?.response?.data?.message;

            let msg;
            if (backendMsg) {
                msg = backendMsg;
            } else if (status === 401 || status === 403) {
                msg = 'Não foi possível autenticar com o Google. Tente novamente.';
            } else if (status === 409) {
                msg = 'Este email do Google já está vinculado a outra conta.';
            } else if (status === 422) {
                const firstError = error?.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()[0]
                    : null;
                msg = firstError ?? 'Dados inválidos recebidos do Google.';
            } else if (status >= 500) {
                msg = 'Erro no servidor. Tente novamente mais tarde.';
            } else if (error?.message?.includes('Network Error') || error?.message?.includes('timeout')) {
                msg = 'Erro de conexão. Verifique sua internet e tente novamente.';
            } else {
                msg = error?.message || 'Erro ao conectar com o Google.';
            }

            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Pre-renders Google's own sign-in button into an off-screen container as
    // soon as the page loads. Doing this ahead of time (instead of reacting to
    // the async One Tap "not displayed" notification) means our custom
    // button's onClick can forward a *synchronous* click to it, which keeps
    // the browser's user-activation/popup permission intact. Browsers with
    // stricter popup-trust rules (Firefox and forks like Zen) reject popups
    // opened from a click that happens after an async gap, which is why the
    // previous "click a hidden button inside the prompt() callback" approach
    // worked in Chromium browsers but silently failed there.
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        let cancelled = false;

        loadGsi()
            .then(() => {
                if (cancelled || !window.google?.accounts?.id) return;

                if (!initializedRef.current) {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleCredentialResponse,
                        ux_mode: 'popup',
                        auto_select: false,
                    });
                    initializedRef.current = true;
                }

                if (containerRef.current && !containerRef.current.hasChildNodes()) {
                    window.google.accounts.id.renderButton(containerRef.current, {
                        type: 'standard',
                        size: 'large',
                        width: 240,
                    });
                }
            })
            .catch(() => {
                // triggerGoogleLogin() surfaces the failure when the user clicks.
            });

        return () => {
            cancelled = true;
        };
    }, [handleCredentialResponse]);

    // The Google popup gives us no direct "closed/cancelled" event in this
    // flow, so treat regaining window focus as a signal the popup is gone and
    // clear a stuck spinner if no credential arrived shortly after.
    useEffect(() => {
        const onFocus = () => {
            window.setTimeout(() => {
                setIsLoading((prev) => (prev ? false : prev));
            }, 1500);
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const triggerGoogleLogin = useCallback(() => {
        if (isLoading) return;

        if (!GOOGLE_CLIENT_ID) {
            toast.error('Google Client ID não configurado.');
            return;
        }

        const realButton = containerRef.current?.querySelector('div[role="button"]');

        if (!realButton) {
            toast.error('Google Sign-In ainda está carregando. Tente novamente em instantes.');
            return;
        }

        setIsLoading(true);
        realButton.click();
    }, [isLoading]);

    return { triggerGoogleLogin, isLoading, containerRef };
}
