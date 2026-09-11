import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';

const FloatLabelField = forwardRef(
    (
        {
            id,
            name,
            as = 'input',
            type = 'text',
            label,
            value,
            defaultValue: defaultValueProp,
            onChange,
            error,
            helperText,
            isRequired = false,
            isDisabled = false,
            prefix,
            className = '',
            containerClassName = '',
            inputProps = {},
            rightElement,
        },
        ref,
    ) => {
        const autoId = useId();
        const fieldId = id || autoId;
        const internalRef = useRef(null);
        const [internalValue, setInternalValue] = useState(
            defaultValueProp ?? inputProps?.defaultValue ?? '',
        );

        const InputComponent = as === 'textarea' ? 'textarea' : 'input';

        const effectiveValue =
            value !== undefined && value !== null ? value : internalValue;

        useEffect(() => {
            if (InputComponent !== 'textarea') return;
            const element = internalRef.current;
            if (!element) return;

            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }, [InputComponent, effectiveValue]);

        const assignRefs = (node) => {
            internalRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        };

        const { defaultValue: _stripDefaultValue, ...cleanInputProps } = inputProps;
        const resolvedInputProps = { ...cleanInputProps };

        if (InputComponent === 'textarea' || type === 'text') {
            if (resolvedInputProps.maxLength === undefined) {
                resolvedInputProps.maxLength = 250;
            }
        }

        const chars = Array.from(label || '');

        return (
            <div className={`w-full ${containerClassName}`}>
                <div className="wave-group">
                    {prefix && (
                        <span className="pointer-events-none absolute left-1 top-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500">
                            {prefix}
                        </span>
                    )}

                    <InputComponent
                        id={fieldId}
                        name={name || fieldId}
                        {...(InputComponent === 'input' ? { type } : {})}
                        value={effectiveValue}
                        onChange={(event) => {
                            if (value === undefined) {
                                setInternalValue(event.target.value);
                            }

                            if (onChange) {
                                onChange(event);
                            }
                        }}
                        disabled={isDisabled}
                        ref={assignRefs}
                        required={isRequired}
                        placeholder=" "
                        className={
                            'wave-input ' +
                            (prefix ? 'pl-8 ' : '') +
                            (rightElement ? 'pr-9 ' : '') +
                            (error ? 'wave-input--error ' : '') +
                            (isDisabled ? 'cursor-not-allowed opacity-60 ' : '') +
                            (InputComponent === 'textarea' ? 'resize-none overflow-hidden ' : '') +
                            className
                        }
                        {...resolvedInputProps}
                    />

                    <span className="wave-bar" aria-hidden="true" />

                    {rightElement && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                            {rightElement}
                        </div>
                    )}

                    <label htmlFor={fieldId} className={`wave-label ${prefix ? '!left-8' : ''}`}>
                        {chars.map((ch, i) => (
                            <span key={i} style={{ '--index': i }} className="wave-char">
                                {ch}
                            </span>
                        ))}
                        {isRequired && (
                            <span style={{ '--index': chars.length }} className="wave-char ml-0.5 text-red-400">
                                *
                            </span>
                        )}
                    </label>
                </div>

                {helperText && !error && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {helperText}
                    </p>
                )}

                {error && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

FloatLabelField.displayName = 'FloatLabelField';

export default FloatLabelField;
