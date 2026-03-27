import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FaturaMonthDropdownGrid from "@/Components/system/fatura/FaturaMonthDropdownGrid";

export default function TransactionFilters({
  searchTerm,
  onSearchChange,
  months = [],
  selectedMonthKey,
  onMonthChange,
  orderOptions = [],
  selectedOrder,
  onOrderChange,
  bankAccounts = [],
  selectedBankId,
  onBankChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  recurringFilter,
  onRecurringChange,
  categories = [],
  selectedCategoryId,
  onCategoryChange,
  onClear,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (selectedBankId) {
      const bank = bankAccounts.find((b) => String(b.id) === String(selectedBankId));
      chips.push({ key: "bank", label: bank?.name || "Banco", onRemove: () => onBankChange?.("") });
    }
    if (selectedType) {
      chips.push({ key: "type", label: selectedType === "debit" ? "Débito" : "Crédito", onRemove: () => onTypeChange?.("") });
    }
    if (selectedStatus) {
      const statusLabels = { unpaid: "Pendentes", paid: "Pagas", overdue: "Vencidas" };
      chips.push({ key: "status", label: statusLabels[selectedStatus] || selectedStatus, onRemove: () => onStatusChange?.("") });
    }
    if (recurringFilter) {
      chips.push({ key: "recurring", label: recurringFilter === "recurring" ? "Recorrentes" : "Não recorrentes", onRemove: () => onRecurringChange?.("") });
    }
    if (selectedCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
      chips.push({ key: "category", label: cat?.name || "Categoria", onRemove: () => onCategoryChange?.("") });
    }
    return chips;
  }, [selectedBankId, selectedType, selectedStatus, recurringFilter, selectedCategoryId, bankAccounts, categories]);

  const selectCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm themed-focus dark:border-gray-700/60 dark:bg-[#0a0a0a] dark:text-gray-100 transition-colors";

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Search + Month + Filter toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs shadow-sm themed-focus dark:border-gray-700/60 dark:bg-[#0a0a0a] dark:text-gray-100 transition-colors"
            placeholder="Buscar transações..."
          />
        </div>

        {months && months.length > 0 && (
          <FaturaMonthDropdownGrid
            months={months}
            value={selectedMonthKey || months[0]?.month_key || ""}
            onChange={(key) => onMonthChange?.(key || "")}
          />
        )}

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            filtersOpen || activeFilters.length > 0
              ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700/60 dark:bg-[#0a0a0a] dark:text-gray-300 dark:hover:bg-white/5"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {activeFilters.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[10px] font-bold text-white">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Order buttons */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Ordenar
        </span>
        <div className="flex gap-1">
          {orderOptions.map((opt) => {
            const isSelected = selectedOrder?.startsWith(opt.key);
            const currentDir = isSelected && selectedOrder.endsWith("_asc") ? "asc" : "desc";
            const nextDir = isSelected && currentDir === "desc" ? "asc" : "desc";
            const arrow = isSelected ? (currentDir === "asc" ? "↑" : "↓") : "";
            const dynamicLabel = (() => {
              if (opt.key === "title") {
                return isSelected && currentDir === "desc" ? "Z-A" : "A-Z";
              }
              return opt.label;
            })();

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onOrderChange?.(`${opt.key}_${nextDir}`)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? "themed-pill-active shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                }`}
              >
                {dynamicLabel} {arrow}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-accent)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--theme-accent)]"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--theme-accent)]/20 transition-colors"
                aria-label={`Remover filtro ${chip.label}`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Collapsible filter panel */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border border-gray-200 dark:border-gray-700/40 bg-gray-50 dark:bg-white/[0.02] p-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Banco</label>
                <select value={selectedBankId} onChange={(e) => onBankChange?.(e.target.value)} className={selectCls}>
                  <option value="">Todos</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Tipo</label>
                <select value={selectedType} onChange={(e) => onTypeChange?.(e.target.value)} className={selectCls}>
                  <option value="">Débito e crédito</option>
                  <option value="debit">Apenas débito</option>
                  <option value="credit">Apenas crédito</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Status</label>
                <select value={selectedStatus} onChange={(e) => onStatusChange?.(e.target.value)} className={selectCls}>
                  <option value="">Todos</option>
                  <option value="unpaid">Pendentes</option>
                  <option value="paid">Pagas</option>
                  <option value="overdue">Vencidas</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Recorrência</label>
                <select value={recurringFilter} onChange={(e) => onRecurringChange?.(e.target.value)} className={selectCls}>
                  <option value="">Todas</option>
                  <option value="recurring">Recorrentes</option>
                  <option value="non_recurring">Não recorrentes</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Categoria</label>
                <select value={selectedCategoryId} onChange={(e) => onCategoryChange?.(e.target.value)} className={selectCls}>
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
