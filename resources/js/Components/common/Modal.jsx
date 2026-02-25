import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useCallback, useRef } from 'react';
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

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    maxWidth = '2xl',
    closeOnOverlay = true,
    closeOnEscape = true,
    initialFocus,
    children,
}) {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);
    const descriptionId = description ? 'modal-description' : undefined;

    const handleOverlayClick = () => {
        if (closeOnOverlay) {
            onClose?.();
        }
    };

    const handleKeyDown = useCallback((event) => {
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

            if (event.shiftKey && document.activeElement === firstElement) {
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

        previousFocusRef.current = document.activeElement;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        document.addEventListener('keydown', handleKeyDown);

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
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;

            document.removeEventListener('keydown', handleKeyDown);
            
            clearTimeout(focusTimer);

            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, handleKeyDown, initialFocus]);

    const widthClass = maxWidthClassMap[maxWidth] ?? maxWidthClassMap['2xl'];

    return (
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
                        className="absolute inset-0 bg-gray-500/75"
                        onClick={handleOverlayClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        aria-hidden="true"
                    />

                    <motion.div
                        ref={modalRef}
                        className={`relative w-full transform overflow-hidden rounded-lg themed-modal-panel shadow-xl transition-all sm:mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col ${widthClass}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? 'modal-title' : undefined}
                        aria-describedby={descriptionId}
                        tabIndex={-1}
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        {(title || onClose) && (
                            <div className="flex items-center justify-between border-b themed-modal-header px-2.5 py-2 sm:px-4 sm:py-3 flex-shrink-0">
                                <div>
                                    {title && (
                                        <h2
                                            id="modal-title"
                                            className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100"
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

                                {onClose && (
                                    <BareButton
                                        type="button"
                                        onClick={() => onClose?.()}
                                        className="inline-flex rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-1"
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
                        )}

                        <div className="px-2.5 py-3 sm:px-4 sm:py-5 md:p-6 overflow-y-auto scrollbar-custom flex-1">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
