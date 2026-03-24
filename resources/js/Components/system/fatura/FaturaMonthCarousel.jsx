import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import { formatCurrency } from "@/Lib/formatters";

export default function FaturaMonthCarousel({
  months = [],
  total_spent,
  total_paid = 0,
  selectedMonthKey,
  onChangeMonth,
}) {
  if (!months || months.length === 0) return null;

  const formatMonthLabel = (monthKey, fallbackLabel) => {
    if (!monthKey || typeof monthKey !== "string") {
      return fallbackLabel || monthKey || "";
    }

    const [yearStr, monthStr] = monthKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (!year || !month) {
      return fallbackLabel || monthKey;
    }

    try {
      const date = new Date(year, month - 1, 1);
      return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return fallbackLabel || monthKey;
    }
  };

  const capitalizeFirst = (text) => {
    if (!text || typeof text !== "string") return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const currentIndex = months.findIndex((m) => m.month_key === selectedMonthKey);
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  const current = months[effectiveIndex];
  const prev = months[effectiveIndex - 1] || null;
  const next = months[effectiveIndex + 1] || null;

  const isPaid = current?.is_paid;
  const isPartiallyPaid = current?.is_partially_paid;
  const hasRemainingPostPayment = current?.has_remaining_post_payment ?? false;
  const currentTotalPaid = current?.total_paid ?? total_paid ?? 0;
  const currentTotalSpent = current?.total_spent ?? total_spent ?? 0;

  const partialProgressPercent =
    currentTotalSpent > 0 ? Math.round(Math.min(currentTotalPaid / currentTotalSpent, 1) * 100) : 0;

  const canPrev = !!prev;
  const canNext = !!next;

  const [direction, setDirection] = useState(0);

  const handlePrev = () => {
    if (!canPrev) return;
    setDirection(-1);
    onChangeMonth(prev.month_key);
  };

  const handleNext = () => {
    if (!canNext) return;
    setDirection(1);
    onChangeMonth(next.month_key);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 25 },
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.18 },
    }),
  };
  
  return (
	<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3 lg:gap-4 2xl:gap-4">
      <div className="hidden sm:flex justify-end sm:w-32">
        {prev && (
          <SecondaryButton
            type="button"
            onClick={handlePrev}
            className="rounded-full px-3 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900 border-none shadow-none"
          >
            {formatMonthLabel(prev.month_key, prev.month_label)}
          </SecondaryButton>
        )}
      </div>

      <div className="flex-1 flex justify-center items-center gap-2 sm:gap-0">
        <button
          onClick={handlePrev}
          disabled={!canPrev}
          className={`sm:hidden p-2 rounded-full transition-colors ${
            canPrev
              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          }`}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={current.month_key}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`inline-flex flex-col items-center rounded-full px-4 py-2 sm:px-6 sm:py-2 lg:px-8 lg:py-3 2xl:px-8 2xl:py-3 shadow-sm ring-1 bg-gradient-to-r dark:bg-gradient-to-r ${
              isPaid
                ? "from-emerald-50 via-white to-emerald-50 ring-emerald-200 dark:from-[#052e26] dark:via-[#050505] dark:to-[#052e26] dark:ring-emerald-900/50"
                : hasRemainingPostPayment
                ? "from-orange-50 via-white to-orange-50 ring-orange-200 dark:from-[#2e1100] dark:via-[#0b0b0b] dark:to-[#2e1100] dark:ring-orange-900/40"
                : isPartiallyPaid
                ? "from-amber-50 via-white to-amber-50 ring-amber-200 dark:from-[#2e2200] dark:via-[#0b0b0b] dark:to-[#2e2200] dark:ring-amber-900/40"
                : "themed-carousel-unpaid from-[var(--theme-accentLight)] via-white to-[var(--theme-accentLight)] ring-theme-accent/20 dark:via-[#0b0b0b] dark:ring-theme-accent/15"
            }`}
          >
            {isPaid ? (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Paga</span>
            ) : hasRemainingPostPayment ? (
              <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                Novas cobranças
              </span>
            ) : isPartiallyPaid ? (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {partialProgressPercent}% pago
              </span>
            ) : (
              <div />
            )}
            <span
					className={`mt-1 text-lg sm:text-xl md:text-2xl lg:text-3xl 2xl:text-3xl font-bold tracking-tight ${
                isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : hasRemainingPostPayment
                  ? "text-orange-700 dark:text-orange-300"
                  : isPartiallyPaid
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-gray-900 dark:text-gray-50"
              }`}
            >
				  {capitalizeFirst(formatMonthLabel(current.month_key, current.month_label))}
            </span>
            <span className={`font-semibold text-xl sm:text-2xl lg:text-3xl 2xl:text-3xl ${
              isPaid
                ? "text-emerald-600 dark:text-emerald-400"
                : hasRemainingPostPayment
                ? "text-orange-700 dark:text-orange-300"
                : isPartiallyPaid
                ? "text-amber-700 dark:text-amber-300"
                : "themed-amount"
            }`}>
              {formatCurrency(currentTotalSpent)}
            </span>
            {/* Mini progress bar for partial/post-payment states */}
            {(isPartiallyPaid || hasRemainingPostPayment) && !isPaid && currentTotalSpent > 0 && (
              <div className="mt-2 w-full max-w-[120px]">
                <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      hasRemainingPostPayment
                        ? 'bg-orange-500 dark:bg-orange-400'
                        : 'bg-amber-500 dark:bg-amber-400'
                    }`}
                    style={{ width: `${partialProgressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleNext}
          disabled={!canNext}
          className={`sm:hidden p-2 rounded-full transition-colors ${
            canNext
              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          }`}
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden sm:flex justify-start sm:w-32">
        {next && (
          <SecondaryButton
            type="button"
            onClick={handleNext}
					className="rounded-full px-3 py-1 text-[11px] sm:text-xs 2xl:text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900 border-none shadow-none"
          >
						{formatMonthLabel(next.month_key, next.month_label)}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
