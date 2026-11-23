import { useRef } from 'react';
import cx from './cx';

/**
 * Controle segmentado (ex.: 7 dias | 30 dias | Tudo). Semântica de radiogroup:
 * uma opção marcada, Tab entra no grupo e as setas trocam a opção.
 * options: [{ value, label }]
 */
export default function SegmentedControl({ options, value, onChange, label, size = 'md', fullWidth = false, className = '' }) {
    const refs = useRef([]);
    const index = Math.max(0, options.findIndex((o) => o.value === value));

    const move = (event) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next;
        if (keys[event.key]) next = (index + keys[event.key] + options.length) % options.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = options.length - 1;
        else return;
        event.preventDefault();
        onChange?.(options[next].value);
        refs.current[next]?.focus();
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            onKeyDown={move}
            className={cx(
                'rounded-chip border border-line bg-surface-sunken p-1',
                fullWidth ? 'flex w-full' : 'inline-flex',
                className,
            )}
        >
            {options.map((option, i) => {
                const checked = i === index;
                return (
                    <button
                        key={option.value}
                        ref={(el) => (refs.current[i] = el)}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange?.(option.value)}
                        className={cx(
                            'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,color,box-shadow] duration-150 ease-out',
                            'focus-visible:outline-offset-0',
                            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-[13px]',
                            fullWidth && 'flex-1',
                            checked
                                ? 'bg-surface-raised text-content-primary shadow-card ring-1 ring-inset ring-line'
                                : 'text-content-muted hover:text-content-primary',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
