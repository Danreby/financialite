import React from 'react'

export default function LoadingOverlay({ visible = false, message = '' }) {
  if (!visible) return null

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 dark:bg-[#0b0b0b]/80 backdrop-blur-[2px] transition-opacity">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-theme-accent dark:border-gray-600 dark:border-t-theme-accent" />
      {message && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  )
}
