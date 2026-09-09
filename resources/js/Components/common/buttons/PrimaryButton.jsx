import React from 'react'

export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`themed-btn-fill inline-flex items-center justify-center rounded-full border-2 bg-transparent px-6 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
