import React from "react";

export default function FaturaFiltersBar({
  bankAccounts = [],
  categories = [],
  filters = {},
  months = [],
  monthValue,
  onFiltersChange,
  onMonthChange,
}) {
  const selectedBankId = filters?.bank_user_id ?? "";
  const selectedCategoryId = filters?.category_id ?? "";

  const handleBankChange = (event) => {
    const value = event.target.value || undefined;
    if (onFiltersChange) {
      onFiltersChange({
        bank_user_id: value,
        category_id: selectedCategoryId || undefined,
      });
    }
  };

  const handleCategoryChange = (event) => {
    const value = event.target.value || undefined;
    if (onFiltersChange) {
      onFiltersChange({
        bank_user_id: selectedBankId || undefined,
        category_id: value,
      });
    }
  };

  const handleMonthChange = (event) => {
    const key = event.target.value || null;
    if (!key || !onMonthChange) return;
    onMonthChange(key);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
      <select
        value={selectedBankId || ""}
        onChange={handleBankChange}
        className="min-w-[180px] sm:min-w-[200px] lg:min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs lg:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
      >
        <option value="">Todos os bancos</option>
        {bankAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
            {account.due_day ? ` - vence todo dia ${account.due_day}` : ""}
          </option>
        ))}
      </select>

      <select
        value={selectedCategoryId || ""}
        onChange={handleCategoryChange}
        className="min-w-[180px] sm:min-w-[200px] lg:min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs lg:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {months && months.length > 0 && (
        <select
          value={monthValue || ""}
          onChange={handleMonthChange}
          className="min-w-[160px] sm:min-w-[180px] lg:min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs lg:text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
        >
          {months.map((month) => (
            <option key={month.month_key} value={month.month_key}>
              {month.month_label}
              {month.is_paid ? " (paga)" : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
