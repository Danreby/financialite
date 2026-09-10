import React from 'react'

export function AlertCard({ icon, title, message, children, className = '' }) {
  return (
    <div
      className={`border-4 border-theme-primary bg-white p-6 shadow-[10px_10px_0_0_var(--theme-primary)] dark:border-theme-accent dark:bg-[#111] dark:shadow-[10px_10px_0_0_var(--theme-accent)] ${className}`}
    >
      <div className="mb-4 flex items-center gap-4 border-b-2 border-gray-900 pb-4 dark:border-gray-100">
        {icon && (
          <div className="flex flex-shrink-0 items-center justify-center bg-theme-primary p-2 dark:bg-theme-accent">
            <span className="text-white [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
          </div>
        )}
        {title && (
          <p className="text-xl font-black uppercase leading-tight text-gray-900 dark:text-gray-100">
            {title}
          </p>
        )}
      </div>

      {message && (
        <p className="mb-4 border-b-2 border-gray-900 pb-4 text-sm font-semibold leading-relaxed text-gray-900 dark:border-gray-100 dark:text-gray-100">
          {message}
        </p>
      )}

      {children && <div className="space-y-3">{children}</div>}
    </div>
  )
}

export function AlertCardButton({ variant = 'neutral', children, className = '', ...props }) {
  const variantClasses =
    variant === 'danger'
      ? 'border-gray-900 bg-gray-900 text-white shadow-[5px_5px_0_0_#111827] hover:border-red-600 hover:bg-red-600 hover:shadow-[7px_7px_0_0_#7f1d1d] dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:shadow-[5px_5px_0_0_#f3f4f6] dark:hover:border-red-600 dark:hover:bg-red-600 dark:hover:text-white dark:hover:shadow-[7px_7px_0_0_#7f1d1d] dark:active:shadow-none'
      : 'border-gray-900 bg-transparent text-gray-900 shadow-[5px_5px_0_0_#111827] hover:border-gray-700 hover:bg-gray-700 hover:text-white hover:shadow-[7px_7px_0_0_#111827] dark:border-gray-100 dark:text-gray-100 dark:shadow-[5px_5px_0_0_#f3f4f6] dark:hover:border-gray-300 dark:hover:bg-gray-300 dark:hover:text-gray-900 dark:hover:shadow-[7px_7px_0_0_#f3f4f6] dark:active:shadow-none'

  return (
    <button
      type="button"
      className={`group relative block w-full overflow-hidden border-[3px] px-3 py-3 text-center text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:pointer-events-none disabled:opacity-60 ${variantClasses} ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <span className="relative z-10">{children}</span>
    </button>
  )
}
