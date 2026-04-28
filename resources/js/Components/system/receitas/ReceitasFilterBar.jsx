import React from 'react'
import { Search, X } from 'lucide-react'

const TYPE_PILLS = [
  { value: '', label: 'Todas' },
  { value: 'salary', label: '💰 Salário' },
  { value: 'freelance', label: '💻 Freelance' },
  { value: 'investment', label: '📈 Investimento' },
  { value: 'rental', label: '🏠 Aluguel' },
  { value: 'benefit', label: '🎁 Benefício' },
  { value: 'pix', label: '⚡ Pix' },
  { value: 'other', label: '📋 Outros' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Inativas' },
]

export default function ReceitasFilterBar({
  filterType = '',
  filterStatus = '',
  searchTerm = '',
  onFilterType,
  onFilterStatus,
  onSearch,
  incomesByType = {},
}) {
  const hasActiveFilters = filterType || filterStatus || searchTerm

  return (
    <div className="rounded-2xl themed-card p-4 sm:p-5 flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por título, descrição ou banco..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 border-0 
                     text-gray-700 dark:text-gray-300 placeholder-gray-400
                     focus:ring-2 focus:ring-emerald-500/40 transition"
          maxLength={255}
        />
        {searchTerm && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {TYPE_PILLS.filter(p => !p.value || incomesByType[p.value]?.length).map((pill) => {
          const isActive = filterType === pill.value
          return (
            <button
              key={pill.value}
              onClick={() => onFilterType(pill.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {pill.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = filterStatus === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onFilterStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => { onFilterType(''); onFilterStatus(''); onSearch(''); }}
            className="text-xs text-red-500 hover:text-red-600 font-medium transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
