import React, { useId, useState } from 'react';

export default function FloatLabelSelect({
    id,
    name,
    label,
    value,
    onChange,
    children,
    isRequired = false,
    isDisabled = false,
    error,
    helperText,
    containerClassName = '',
    className = '',
}) {
    const autoId = useId();
    const fieldId = id || autoId;
    const [isFocused, setIsFocused] = useState(false);

    const borderClass = error
        ? 'border-red-500 dark:border-red-500'
        : isFocused
        ? 'border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]'
        : 'border-gray-300 dark:border-gray-700';

    const baseSelectClasses = [
        'block w-full rounded-md border bg-white px-3 py-1.5 text-sm shadow-sm',
        'outline-none transition appearance-none',
        'text-gray-900 dark:bg-[#0f0f0f] dark:text-gray-100',
        borderClass,
        isDisabled ? 'cursor-not-allowed opacity-70 bg-gray-100 dark:bg-gray-800' : '',
    ].join(' ');

    const labelColorClass = isFocused
        ? 'text-[var(--theme-accent)]'
        : 'text-gray-500 dark:text-gray-400';

    return (
        <div className={`w-full ${containerClassName}`}>
            <div className="relative mt-1">
                <select
                    id={fieldId}
                    name={name || fieldId}
                    value={value}
                    onChange={onChange}
                    disabled={isDisabled}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`${baseSelectClasses} ${className}`}
                >
                    {children}
                </select>

                <span
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>

                <label
                    htmlFor={fieldId}
                    className={[
                        'pointer-events-none absolute left-3 select-none',
                        'bg-white dark:bg-[#0f0f0f]',
                        'px-1 rounded-sm',
                        'text-[0.7rem] font-medium tracking-wide leading-none',
                        'transition-colors duration-150',
                        labelColorClass,
                    ].join(' ')}
                    style={{ top: '-0.5rem' }}
                >
                    {label}
                    {isRequired && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            </div>

            {helperText && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            )}

            {error && (
                <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}
