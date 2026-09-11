import React, { useId } from 'react'

export default function WaveSelectField({
  label,
  id,
  required = false,
  error,
  helperText,
  className = '',
  children,
  ...props
}) {
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <div className="w-full">
      <div className="wave-group">
        <label htmlFor={fieldId} className="wave-select-label">
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>

        <select
          id={fieldId}
          required={required}
          className={`wave-input wave-select ${error ? 'wave-input--error' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>

        <span className="wave-bar" aria-hidden="true" />
      </div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
