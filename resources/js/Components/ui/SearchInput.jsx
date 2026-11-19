import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Search } from 'lucide-react';
import Input from './Input';
import { useField } from './Field';
import Kbd from './Kbd';

/**
 * Busca com ícone à esquerda e a dica de atalho "Ctrl K" à direita.
 * Sem <Field> com rótulo, passe `aria-label` (padrão: "Buscar").
 * `hotkey` liga o atalho Ctrl/⌘ + K para focar o campo.
 */
const SearchInput = forwardRef(function SearchInput({ hotkey = false, size = 'md', ...props }, ref) {
    const field = useField();
    const inner = useRef(null);
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
            aria-keyshortcuts={hotkey ? 'Control+K' : undefined}
            leading={<Search />}
            trailing={hotkey ? <Kbd>Ctrl K</Kbd> : null}
            className="[&::-webkit-search-cancel-button]:hidden"
            {...props}
        />
    );
});

export default SearchInput;
