import React from 'react'

export default function AuthCard({ children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/95 text-gray-900 shadow-xl ring-1 ring-black/5 dark:bg-gradient-to-b dark:from-[#0b0b0b] dark:via-[#0b0b0b] dark:to-[#0f0f0f] dark:text-gray-100 dark:ring-black/30 sm:rounded-3xl">
      <div className="absolute inset-0 pointer-events-none border border-black/5 mix-blend-overlay opacity-30 dark:border-black/10" />

      <div className="relative">
        {children}
      </div>
    </div>
  )
}
