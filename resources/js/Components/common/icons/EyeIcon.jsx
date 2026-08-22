import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const spring = { type: 'spring', stiffness: 420, damping: 28 }

const EyeIcon = ({ type, open, size = 18, className = 'text-current' }) => {
  const isOpen = open ?? type === 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.g
            key="open"
            style={{ transformOrigin: '12px 12px' }}
            initial={{ opacity: 0, scaleY: 0.35 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.35 }}
            transition={spring}
          >
            <path
              d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.6" />
          </motion.g>
        ) : (
          <motion.g
            key="closed"
            style={{ transformOrigin: '12px 12px' }}
            initial={{ opacity: 0, scaleY: 0.35 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.35 }}
            transition={spring}
          >
            <path
              d="M4.5 7C3 8.4 2 12 2 12s3.8 6.5 10 6.5c1.5 0 2.8-.37 4-1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.5 17c1.5-1.4 2.5-5 2.5-5s-3.8-6.5-10-6.5c-1.5 0-2.8.37-4 1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M2.5 2.5l19 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  )
}

export default EyeIcon
