import { useCallback, useRef, useState } from 'react';
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
    const initializedRef = useRef(false);

    const triggerGoogleLogin = useCallback(async () => {
        if (isLoading) return;
        if (!GOOGLE_CLIENT_ID) {
            toast.error('Google Client ID não configurado.');
            return;
        }

        setIsLoading(true);

        try {
            await loadGsi();

            const credential = await new Promise((resolve, reject) => {
                if (!initializedRef.current) {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: (response) => {
                            if (response.credential) {
                                resolve(response.credential);
                            } else {
                                reject(new Error('Nenhuma credencial recebida do Google.'));
                            }
                        },
                        auto_select: false,
                        cancel_on_tap_outside: true,
                        ux_mode: 'popup',
                    });
                    initializedRef.current = true;
                }

                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed()) {
                        const tempContainer = document.createElement('div');
                        tempContainer.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
                        document.body.appendChild(tempContainer);

                        window.google.accounts.id.renderButton(tempContainer, {
                            type: 'standard',
                            size: 'large',
                        });

                        const btn = tempContainer.querySelector('[role="button"]') || tempContainer.querySelector('div[id^="gsi"]');
                        if (btn) {
                            btn.click();
                        } else {
                            document.body.removeChild(tempContainer);
                            reject(new Error('Não foi possível abrir o popup do Google. Tente novamente.'));
                        }

                        setTimeout(() => {
                            if (document.body.contains(tempContainer)) {
                                document.body.removeChild(tempContainer);
                            }
                        }, 500);
                    }

                    if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
                        reject(new Error('__cancelled__'));
                    }
                });
            });

            const endpoint = mode === 'link'
                ? route('google.link')
                : route('google.token');

            const response = await axios.post(endpoint, { credential });

            if (mode === 'login' && response.data?.redirect) {
                toast.success('Login com Google realizado!');
                window.location.href = response.data.redirect;
            } else if (mode === 'link') {
                toast.success(response.data?.message || 'Conta Google vinculada!');
                router.reload({ only: ['auth'] });
            }
        } catch (error) {
            if (error?.message === '__cancelled__') {
                setIsLoading(false);
                return;
            }

            const status  = error?.response?.status
            const backendMsg = error?.response?.data?.message

            let msg
            if (backendMsg) {
                msg = backendMsg
            } else if (status === 401 || status === 403) {
                msg = 'Não foi possível autenticar com o Google. Tente novamente.'
            } else if (status === 409) {
                msg = 'Este email do Google já está vinculado a outra conta.'
            } else if (status === 422) {
                // Validation error — use first message from errors bag if available
                const firstError = error?.response?.data?.errors
                    ? Object.values(error.response.data.errors).flat()[0]
                    : null
                msg = firstError ?? 'Dados inválidos recebidos do Google.'
            } else if (status >= 500) {
                msg = 'Erro no servidor. Tente novamente mais tarde.'
            } else if (error?.message?.includes('Network Error') || error?.message?.includes('timeout')) {
                msg = 'Erro de conexão. Verifique sua internet e tente novamente.'
            } else {
                msg = error?.message || 'Erro ao conectar com o Google.'
            }

            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, mode]);

    return { triggerGoogleLogin, isLoading };
}
