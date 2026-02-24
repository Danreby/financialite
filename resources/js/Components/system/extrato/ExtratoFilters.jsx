import React, { useMemo } from 'react'

export default function ExtratoFilters({
  startDate,
  endDate,
  bankUserId,
  categoryId,
  type,
  onStartDateChange,
  onEndDateChange,
  onBankChange,
  onCategoryChange,
  onTypeChange,
  onClear,
  bankAccounts = [],
  categories = [],
}) {
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (bankUserId) count++
    if (categoryId) count++
    if (type) count++
    return count
  }, [bankUserId, categoryId, type])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm dark:border-gray-800 dark:bg-[#0b0b0b]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
            Filtros
          </h3>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-theme-accent px-1.5 text-[10px] font-semibold text-white">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Filter inputs */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-start-date"
            className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300"
          >
            📅 Data início
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            aria-label="Data de início do período"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-end-date"
            className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300"
          >
            📅 Data fim
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            aria-label="Data final do período"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[120px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-type"
            className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300"
          >
            💳 Tipo
          </label>
          <select
            id="filter-type"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            aria-label="Tipo de transação"
          >
            <option value="">Todos</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-bank"
            className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300"
          >
            💳 Cartão
          </label>
          <select
            id="filter-bank"
            value={bankUserId}
            onChange={(e) => onBankChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            aria-label="Filtrar por cartão"
          >
            <option value="">Todos</option>
            {bankAccounts.map((ba) => (
              <option key={ba.id} value={ba.id}>
                {ba.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px] flex-1 sm:flex-none">
          <label
            htmlFor="filter-category"
            className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300"
          >
            📂 Categoria
          </label>
          <select
            id="filter-category"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon && `${cat.icon} `}{cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}