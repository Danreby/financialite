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

        const { defaultValue: _stripDefaultValue, style: inputStyle, ...cleanInputProps } = inputProps;
        const resolvedInputProps = { ...cleanInputProps };

        if (InputComponent === 'textarea' || type === 'text') {
            if (resolvedInputProps.maxLength === undefined) {
                resolvedInputProps.maxLength = 250;
            }
        }

        // "(opcional)" is rendered as its own dim, non-staggered suffix instead
        // of being exploded into wave-char spans with the rest of the label —
        // otherwise it reads as glued to the word before it and, being extra
        // characters, pushes out the per-character animation delay below.
        const OPTIONAL_SUFFIX = ' (opcional)';
        const hasOptionalSuffix = (label || '').endsWith(OPTIONAL_SUFFIX);
        const mainLabel = hasOptionalSuffix
            ? label.slice(0, -OPTIONAL_SUFFIX.length)
            : label;
        const chars = Array.from(mainLabel || '');

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
                        style={{
                            ...inputStyle,
                            // `.wave-group .wave-input` sets padding via a plain CSS
                            // rule more specific than the pl-8/pr-9 utility classes
                            // below, so those utilities never actually take effect —
                            // an inline style is the only thing guaranteed to win.
                            ...(prefix ? { paddingLeft: '2rem' } : {}),
                            ...(rightElement ? { paddingRight: '2.25rem' } : {}),
                        }}
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
                        {hasOptionalSuffix && (
                            <span className="wave-optional">(opcional)</span>
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
