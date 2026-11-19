import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import BareButton from '@/Components/common/buttons/BareButton';

const maxWidthClassMap = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
};

const getFocusableElements = (container) => {
    if (!container) return [];
    
    const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
};

// Pilha de modais abertos: só o de cima responde a Esc, Tab e foco que escapa.
const openModals = [];
const isTopModal = (ref) => openModals[openModals.length - 1] === ref;

const focusInside = (container) => {
    const focusableElements = getFocusableElements(container);
    (focusableElements[0] ?? container)?.focus();
};

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    maxWidth = '2xl',
    closeOnOverlay = true,
    closeOnEscape = true,
    initialFocus,
    headerActions,
    children,
}) {
    const modalRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const previousFocusRef = useRef(null);
    const descriptionId = description ? 'modal-description' : undefined;

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose?.();
        }
    };

    const handleKeyDown = useCallback((event) => {
        if (!isTopModal(modalRef)) return;

        if (event.key === 'Escape' && closeOnEscape) {
            event.preventDefault();
            onClose?.();
            return;
        }

        if (event.key === 'Tab' && modalRef.current) {
            const focusableElements = getFocusableElements(modalRef.current);
            
            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // Foco fora do diálogo (clique fora, por exemplo): Tab traz de volta.
            if (!modalRef.current.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? lastElement : firstElement).focus();
            } else if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, [closeOnEscape, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        // Se o foco sair do diálogo (clique no fundo, leitor de tela), puxa de volta.
        const handleFocusIn = (event) => {
            if (!isTopModal(modalRef) || !modalRef.current) return;
            if (!modalRef.current.contains(event.target)) {
                focusInside(modalRef.current);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', handleFocusIn);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;

            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', handleFocusIn);
        };
    }, [isOpen, handleKeyDown]);

    // Entra na pilha só ao abrir (não a cada nova referência de handleKeyDown).
    useEffect(() => {
        if (!isOpen) return undefined;
        openModals.push(modalRef);
        return () => {
            const index = openModals.lastIndexOf(modalRef);
            if (index !== -1) openModals.splice(index, 1);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement;

        const focusTimer = setTimeout(() => {
            if (initialFocus?.current) {
                initialFocus.current.focus();
            } else if (modalRef.current) {
                const focusableElements = getFocusableElements(modalRef.current);
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                } else {
                    modalRef.current.focus();
                }
            }
        }, 0);

        return () => {
            clearTimeout(focusTimer);

            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen]);

    const widthClass = maxWidthClassMap[maxWidth] ?? maxWidthClassMap['2xl'];

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-2 py-2 sm:px-4 sm:py-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-hidden={!isOpen}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/60"
                        onClick={handleOverlayClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        aria-hidden="true"
                    />

                    <motion.div
                        ref={modalRef}
                        className={`relative w-full transform overflow-hidden surface-card shadow-pop sm:mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col ${widthClass}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? 'modal-title' : undefined}
                        aria-describedby={descriptionId}
                        tabIndex={-1}
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {(title || onClose) && (
                            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5 flex-shrink-0">
                                <div>
                                    {title && (
                                        <h2
                                            id="modal-title"
                                            className="text-sm sm:text-[15px] font-semibold text-content-primary"
                                        >
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p
                                            id={descriptionId}
                                            className="sr-only"
                                        >
                                            {description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                    {headerActions}
                                    {onClose && (
                                        <BareButton
                                            type="button"
                                            onClick={() => onClose?.()}
                                            className="inline-flex rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content-primary"
                                            aria-label="Fechar modal"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </BareButton>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-4 sm:px-5 sm:py-5 overflow-y-auto scrollbar-custom flex-1">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
