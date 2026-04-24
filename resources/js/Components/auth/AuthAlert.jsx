import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@inertiajs/react'

export default function AuthAlert({
  variant = 'error',
  message,
  action,
  show,
  className = '',
}) {
  const isVisible = show !== undefined ? show : !!message

  const styles = {
    error: {
      wrapper: 'border-red-500/30 bg-red-500/10',
      icon:    'text-red-400',
      text:    'text-red-300',
      action:  'text-red-300 hover:text-red-100 underline underline-offset-2',
    },
    warning: {
      wrapper: 'border-amber-500/30 bg-amber-500/10',
      icon:    'text-amber-400',
      text:    'text-amber-300',
      action:  'text-amber-300 hover:text-amber-100 underline underline-offset-2',
    },
    info: {
      wrapper: 'border-blue-500/30 bg-blue-500/10',
      icon:    'text-blue-400',
      text:    'text-blue-300',
      action:  'text-blue-300 hover:text-blue-100 underline underline-offset-2',
    },
    success: {
      wrapper: 'border-emerald-500/30 bg-emerald-500/10',
      icon:    'text-emerald-400',
      text:    'text-emerald-300',
      action:  'text-emerald-300 hover:text-emerald-100 underline underline-offset-2',
    },
  }

  const icons = {
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  }

  const s = styles[variant] ?? styles.error

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${s.wrapper} ${className}`}
        >
          <span className={s.icon}>{icons[variant] ?? icons.error}</span>

          <p className={`flex-1 leading-relaxed ${s.text}`}>
            {message}
            {action && (
              <>
                {' '}
                {action.href ? (
                  <Link href={action.href} className={s.action}>
                    {action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={action.onClick}
                    className={`${s.action} cursor-pointer bg-transparent p-0 border-0`}
                  >
                    {action.label}
                  </button>
                )}
              </>
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
