import React from 'react'

export default function NeumorphicField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
  autoFocus,
  rightElement,
  inputMode,
}) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          aria-label={label}
          aria-invalid={!!error}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          placeholder={label}
          className={`neu-surface neu-inset w-full rounded-xl border-0 px-5 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-shadow focus:ring-1 focus:ring-[var(--theme-accent)] ${
            rightElement ? 'pr-12' : ''
          } ${error ? 'ring-1 ring-red-500/60' : ''}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 pl-1 text-xs font-medium text-red-400">{error}</p>
      )}
    </div>
  )
}
