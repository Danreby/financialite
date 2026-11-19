import { useId } from 'react';
import cx from './cx';

/**
 * Interruptor (role=switch). O rótulo é obrigatório, visível e clicável; `description`
 * fica ligada por aria-describedby.
 */
export default function Switch({ checked, onChange, label, description, disabled = false, className = '' }) {
    const id = useId();

    return (
        <div className={cx('flex items-start justify-between gap-4', className)}>
            <div className="min-w-0">
                <label htmlFor={`${id}-s`} className="cursor-pointer text-sm font-medium text-content-primary">
                    {label}
                </label>
                {description && (
                    <p id={`${id}-d`} className="mt-0.5 text-xs text-content-muted">
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                id={`${id}-s`}
                role="switch"
                aria-checked={!!checked}
                aria-describedby={description ? `${id}-d` : undefined}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={cx(
                    'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    checked ? 'border-transparent bg-theme-accent' : 'border-line-strong bg-surface-sunken',
                )}
            >
                <span
                    aria-hidden="true"
                    className={cx(
                        'inline-block h-[18px] w-[18px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.3)] transition-transform duration-150 ease-out',
                        checked ? 'translate-x-[22px] bg-white' : 'translate-x-[2px] bg-content-muted',
                    )}
                />
            </button>
        </div>
    );
}
