import React from 'react'

/**
 * Loading skeleton para página de extrato
 * Componente isolado seguindo princípios de clean architecture
 */
export default function ExtratoLoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900/40 p-3 sm:p-4 h-20"
          >
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-2" />
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>

      {/* Transactions skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0b0b0b] overflow-hidden">
        {/* Header skeleton */}
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>

        {/* Transaction rows skeleton */}
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50 p-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              {/* Icon circle */}
              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16" />
                </div>
              </div>

              {/* Amount */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
