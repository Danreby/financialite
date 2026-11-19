import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import Input from './Input';
import { useField } from './Field';
import Kbd from './Kbd';

/**
 * Busca com ícone à esquerda e a dica de atalho "Ctrl K" (no Mac, "⌘ K") à direita.
 * Sem <Field> com rótulo, passe `aria-label` (padrão: "Buscar").
 * `hotkey` liga o atalho Ctrl/⌘ + K para focar o campo.
 */
const SearchInput = forwardRef(function SearchInput({ hotkey = false, size = 'md', ...props }, ref) {
    const field = useField();
    const inner = useRef(null);
    const [isMac] = useState(() => {
        if (typeof navigator === 'undefined') return false;
        const platform = navigator.userAgentData?.platform || navigator.platform || '';
        return /mac|iphone|ipad/i.test(platform);
    });
    useImperativeHandle(ref, () => inner.current);

    useEffect(() => {
        if (!hotkey) return undefined;
        const onKey = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                inner.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [hotkey]);

    return (
        <Input
            ref={inner}
            type="search"
            size={size}
            aria-label={field || props.id ? undefined : 'Buscar'}
            aria-keyshortcuts={hotkey ? (isMac ? 'Meta+K' : 'Control+K') : undefined}
            leading={<Search />}
            trailing={hotkey ? <Kbd>{isMac ? '⌘ K' : 'Ctrl K'}</Kbd> : null}
            className="[&::-webkit-search-cancel-button]:hidden"
            {...props}
        />
    );
});

export default SearchInput;
