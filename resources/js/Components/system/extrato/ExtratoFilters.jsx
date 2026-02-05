import React from 'react'

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
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm dark:border-gray-800 dark:bg-[#0b0b0b]">
      <div className="flex flex-wrap items-end gap-3">
        {/* Data início */}
        <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-none">
          <label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            Data início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          />
        </div>

        {/* Data fim */}
        <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-none">
          <label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            Data fim
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          />
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-1 min-w-[120px] flex-1 sm:flex-none">
          <label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
        </div>

        {/* Banco */}
        <div className="flex flex-col gap-1 min-w-[150px] flex-1 sm:flex-none">
          <label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            Banco
          </label>
          <select
            value={bankUserId}
            onChange={(e) => onBankChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          >
            <option value="">Todos</option>
            {bankAccounts.map((ba) => (
              <option key={ba.id} value={ba.id}>{ba.name}</option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1 min-w-[150px] flex-1 sm:flex-none">
          <label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Limpar */}
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
