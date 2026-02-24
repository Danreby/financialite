import React, { useMemo } from 'react'
import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ExtratoFilters from '@/Components/system/extrato/ExtratoFilters'
import ExtratoSummary from '@/Components/system/extrato/ExtratoSummary'
import ExtratoIncomeBar from '@/Components/system/extrato/ExtratoIncomeBar'
import ExtratoTransactionsContainer from '@/Components/system/extrato/ExtratoTransactionsContainer'
import ExtratoLoadingState from '@/Components/system/extrato/ExtratoLoadingState'
import ExtratoActionsBar from '@/Components/system/extrato/ExtratoActionsBar'
import ExtratoPeriodBadge from '@/Components/system/extrato/ExtratoPeriodBadge'
import ExtratoQuickPeriod from '@/Components/system/extrato/ExtratoQuickPeriod'
import ExtratoSpendingOverview from '@/Components/system/extrato/ExtratoSpendingOverview'
import ExtratoCategoryBreakdown from '@/Components/system/extrato/ExtratoCategoryBreakdown'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'
import { useExtratoData } from '@/Hooks/useExtratoData'

export default function Extrato({ bankAccounts = [], categories = [] }) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const initialFilters = {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    bankUserId: '',
    categoryId: '',
    type: '',
  }

  const {
    transactions,
    incomes,
    summary,
    loading,
    filters,
    totalTransactions,
    updateFilters,
    resetFilters,
  } = useExtratoData(initialFilters)

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.bankUserId ||
      filters.categoryId ||
      filters.type ||
      filters.startDate !== initialFilters.startDate ||
      filters.endDate !== initialFilters.endDate
    )
  }, [filters, initialFilters])

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value })
  }

  const handleQuickPeriod = ({ startDate, endDate }) => {
    updateFilters({ startDate, endDate })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Extrato" />

      <FadeInContainer type="container" stagger className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-3 space-y-4 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        {/* Header */}
        <FadeInItem type="fast">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col gap-1 pt-0.5 sm:pt-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  Extrato Financeiro
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
                  Visão detalhada de todas as suas movimentações financeiras no período selecionado.
                </p>
              </div>
              <ExtratoPeriodBadge startDate={filters.startDate} endDate={filters.endDate} />
            </div>

            {/* Quick period selection */}
            <ExtratoQuickPeriod
              startDate={filters.startDate}
              endDate={filters.endDate}
              onSelect={handleQuickPeriod}
            />
          </div>
        </FadeInItem>

        {/* Filters */}
        <FadeInItem type="subtle">
          <ExtratoFilters
            startDate={filters.startDate}
            endDate={filters.endDate}
            bankUserId={filters.bankUserId}
            categoryId={filters.categoryId}
            type={filters.type}
            onStartDateChange={(value) => handleFilterChange('startDate', value)}
            onEndDateChange={(value) => handleFilterChange('endDate', value)}
            onBankChange={(value) => handleFilterChange('bankUserId', value)}
            onCategoryChange={(value) => handleFilterChange('categoryId', value)}
            onTypeChange={(value) => handleFilterChange('type', value)}
            onClear={resetFilters}
            bankAccounts={bankAccounts}
            categories={categories}
          />
        </FadeInItem>

        {loading && (
          <FadeInItem type="item">
            <ExtratoLoadingState />
          </FadeInItem>
        )}

        {!loading && (
          <>
            {/* Income bar */}
            {incomes.length > 0 && (
              <FadeInItem type="item">
                <ExtratoIncomeBar incomes={incomes} />
              </FadeInItem>
            )}

            {/* Summary cards */}
            {summary && (
              <FadeInItem type="item">
                <ExtratoSummary summary={summary} />
              </FadeInItem>
            )}

            {/* Spending overview + category breakdown */}
            {summary && transactions.length > 0 && (
              <FadeInContainer stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FadeInItem type="feature">
                  <ExtratoSpendingOverview summary={summary} transactions={transactions} />
                </FadeInItem>
                <FadeInItem type="feature">
                  <ExtratoCategoryBreakdown transactions={transactions} />
                </FadeInItem>
              </FadeInContainer>
            )}

            {/* Actions bar */}
            <FadeInItem type="item">
              <ExtratoActionsBar
                transactionCount={totalTransactions}
                onExport={null}
              />
            </FadeInItem>

            {/* Transactions list */}
            <FadeInItem type="item">
              <ExtratoTransactionsContainer
                transactions={transactions}
                totalCount={totalTransactions}
                onClearFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </FadeInItem>
          </>
        )}
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}
