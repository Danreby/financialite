import React, { forwardRef, useId, useState } from 'react';
import { motion } from 'framer-motion';

const FloatLabelField = forwardRef(
    (
        {
            id,
            name,
            type = 'text',
            label,
            value,
            onChange,
            error,
            helperText,
            isRequired = false,
            isDisabled = false,
            className = '',
            containerClassName = '',
            inputProps = {},
        },
        ref,
    ) => {
        const autoId = useId();
        const fieldId = id || autoId;
        const [isFocused, setIsFocused] = useState(false);

        const hasValue =
            value !== undefined && value !== null && String(value).length > 0;
        const isFloating = isFocused || hasValue;

        const baseInputClasses =
            'block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm outline-none transition ' +
            'placeholder-transparent text-gray-900 ' +
            'focus:border-rose-500 focus:ring-1 focus:ring-rose-500 ' +
            'dark:border-gray-700 dark:bg-[#020617] dark:text-gray-100 dark:focus:border-rose-400 dark:focus:ring-rose-400 ';

        const errorInputClasses = error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-500 dark:focus:border-rose-400 dark:focus:ring-rose-400 '
            : '';

        const disabledClasses = isDisabled
            ? 'cursor-not-allowed opacity-70 bg-gray-100 dark:bg-gray-800 '
            : '';

        return (
            <div className={`w-full ${containerClassName}`}>
                <div className="relative">
                    <input
                        id={fieldId}
                        name={name || fieldId}
                        type={type}
                        value={value}
                        onChange={onChange}
                        disabled={isDisabled}
                        ref={ref}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={
                            baseInputClasses +
                            errorInputClasses +
                            disabledClasses +
                            className
                        }
                        {...inputProps}
                    />

                    <motion.label
                        htmlFor={fieldId}
                        initial={false}
                        animate={
                            isFloating
                                ? {
                                      y: 0,
                                      x: 0,
                                      scale: 0.85,
                                      opacity: 0.95,
                                  }
                                : {
                                      y: 12,
                                      x: 0,
                                      scale: 1,
                                      opacity: 0.85,
                                  }
                        }
                        transition={{ type: 'tween', duration: 0.16 }}
                        className={
                            'pointer-events-none absolute left-3 -top-1 origin-left select-none text-[0.78rem] font-medium tracking-wide ' +
                            'text-gray-500 dark:text-gray-400 bg-white dark:bg-[#020617] px-1'
                        }
                    >
                        {label}
                        {isRequired && <span className="ml-0.5 text-rose-500">*</span>}
                    </motion.label>
                </div>

                {helperText && !error && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {helperText}
                    </p>
                )}

                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs font-medium text-rose-500"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    },
);

FloatLabelField.displayName = 'FloatLabelField';

export default FloatLabelField;
