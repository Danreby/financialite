import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Search, ArrowDownUp, ChevronDown } from "lucide-react";
import FaturaMonthDropdownGrid from "@/Components/system/fatura/FaturaMonthDropdownGrid";

/* ─── Quick-filter pill ──────────────────────────────────────── */
function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-[var(--theme-accent)] text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Active filter chip ─────────────────────────────────────── */
function ActiveChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-accent)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--theme-accent)]/20 transition-colors"
        aria-label={`Remover filtro ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

const selectCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm themed-focus dark:border-gray-700/60 dark:bg-[#0a0a0a] dark:text-gray-100 transition-colors";

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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  /* Only bank, category and recurrence count as "secondary" filters
     (type and status are shown as quick-pills, so not in active chips) */
  const activeChips = useMemo(() => {
    const chips = [];
    if (selectedBankId) {
      const bank = bankAccounts.find((b) => String(b.id) === String(selectedBankId));
      chips.push({ key: "bank", label: bank?.name || "Banco", onRemove: () => onBankChange?.("") });
    }
    if (recurringFilter) {
      chips.push({
        key: "recurring",
        label: recurringFilter === "recurring" ? "Recorrentes" : "Não recorrentes",
        onRemove: () => onRecurringChange?.(""),
      });
    }
    if (selectedCategoryId) {
      const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
      chips.push({ key: "category", label: cat?.name || "Categoria", onRemove: () => onCategoryChange?.("") });
    }
    return chips;
  }, [selectedBankId, recurringFilter, selectedCategoryId, bankAccounts, categories]);

  const advancedCount = activeChips.length;
  const hasAnyFilter = !!(selectedBankId || selectedType || selectedStatus || recurringFilter || selectedCategoryId || searchTerm || selectedMonthKey);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Row 1 – search + month + sort */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2 text-xs shadow-sm themed-focus dark:border-gray-700/60 dark:bg-[#0a0a0a] dark:text-gray-100 transition-colors"
            placeholder="Buscar por título…"
            maxLength={255}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Month picker */}
        {months.length > 0 && (
          <FaturaMonthDropdownGrid
            months={months}
            value={selectedMonthKey || months[0]?.month_key || ""}
            onChange={(key) => onMonthChange?.(key || "")}
          />
        )}

        {/* Sort */}
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 dark:border-gray-700/60 dark:bg-[#0a0a0a] flex-shrink-0">
          <ArrowDownUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          {orderOptions.map((opt) => {
            const isSelected = selectedOrder?.startsWith(opt.key);
            const currentDir = isSelected && selectedOrder.endsWith("_asc") ? "asc" : "desc";
            const nextDir = isSelected && currentDir === "desc" ? "asc" : "desc";
            const dynamicLabel = (() => {
              if (opt.key === "title") return isSelected && currentDir === "desc" ? "Z-A" : "A-Z";
              return opt.label;
            })();
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onOrderChange?.(`${opt.key}_${nextDir}`)}
                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? "themed-pill-active shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {dynamicLabel}
                {isSelected && (
                  <span className="ml-0.5 opacity-70">{currentDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2 – quick-filter pills for Type & Status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-shrink-0 mr-1">
          Tipo
        </span>
        <FilterPill label="Todos" active={!selectedType} onClick={() => onTypeChange?.("")} />
        <FilterPill label="Débito" active={selectedType === "debit"} onClick={() => onTypeChange?.(selectedType === "debit" ? "" : "debit")} />
        <FilterPill label="Crédito" active={selectedType === "credit"} onClick={() => onTypeChange?.(selectedType === "credit" ? "" : "credit")} />

        <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />

        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-shrink-0 mr-1">
          Status
        </span>
        <FilterPill label="Todos" active={!selectedStatus} onClick={() => onStatusChange?.("")} />
        <FilterPill label="Pendentes" active={selectedStatus === "unpaid"} onClick={() => onStatusChange?.(selectedStatus === "unpaid" ? "" : "unpaid")} />
        <FilterPill label="Pagas" active={selectedStatus === "paid"} onClick={() => onStatusChange?.(selectedStatus === "paid" ? "" : "paid")} />
        <FilterPill label="Vencidas" active={selectedStatus === "overdue"} onClick={() => onStatusChange?.(selectedStatus === "overdue" ? "" : "overdue")} />

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className={`ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors flex-shrink-0 ${
            advancedOpen || advancedCount > 0
              ? "text-[var(--theme-accent)] bg-[var(--theme-accent)]/10"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Mais filtros</span>
          {advancedCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[9px] font-bold text-white">
              {advancedCount}
            </span>
          )}
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Active chips from advanced filters */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <ActiveChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {hasAnyFilter && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Limpar tudo
            </button>
          )}
        </div>
      )}

      {/* Advanced filter panel */}
      <AnimatePresence initial={false}>
        {advancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-gray-200 dark:border-gray-700/40 bg-gray-50 dark:bg-white/[0.02] p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cartão / Conta
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => onBankChange?.(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Todos</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recorrência
                </label>
                <select
                  value={recurringFilter}
                  onChange={(e) => onRecurringChange?.(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Todas</option>
                  <option value="recurring">Recorrentes</option>
                  <option value="non_recurring">Não recorrentes</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
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
