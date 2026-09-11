import React, { useId } from 'react'

export default function WaveInputField({
  label,
  id,
  name,
  as = 'input',
  type = 'text',
  prefix,
  required = false,
  error,
  helperText,
  className = '',
  inputClassName = '',
  ...props
}) {
  const autoId = useId()
  const fieldId = id || autoId
  const Comp = as === 'textarea' ? 'textarea' : 'input'
  const chars = Array.from(label || '')

  return (
    <div className={`w-full ${className}`}>
      <div className="wave-group">
        {prefix && (
          <span className="pointer-events-none absolute left-1 top-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500">
            {prefix}
          </span>
        )}

        <Comp
          id={fieldId}
          name={name}
          {...(Comp === 'input' ? { type } : {})}
          required={required}
          placeholder=" "
          className={`wave-input ${prefix ? 'pl-8' : ''} ${as === 'textarea' ? 'resize-none' : ''} ${inputClassName}`}
          {...props}
        />

        <span className="wave-bar" aria-hidden="true" />

        <label htmlFor={fieldId} className={`wave-label ${prefix ? '!left-8' : ''}`}>
          {chars.map((ch, i) => (
            <span key={i} style={{ '--index': i }} className="wave-char">
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
          {required && (
            <span style={{ '--index': chars.length }} className="wave-char ml-0.5 text-red-400">
              *
            </span>
          )}
        </label>
      </div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
