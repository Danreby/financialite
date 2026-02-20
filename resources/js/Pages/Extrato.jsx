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

  return (
    <AuthenticatedLayout>
      <Head title="Extrato" />

      <FadeInContainer type="container" stagger className="space-y-4 sm:space-y-6">
        <FadeInItem type="item">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Extrato Financeiro
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Visão detalhada de todas as suas movimentações financeiras.
              </p>
            </div>
            
            <ExtratoPeriodBadge startDate={filters.startDate} endDate={filters.endDate} />
          </div>
        </FadeInItem>

        <FadeInItem type="item">
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
            {incomes.length > 0 && (
              <FadeInItem type="item">
                <ExtratoIncomeBar incomes={incomes} />
              </FadeInItem>
            )}

            {summary && (
              <FadeInItem type="item">
                <ExtratoSummary summary={summary} />
              </FadeInItem>
            )}

            <FadeInItem type="item">
              <ExtratoActionsBar
                transactionCount={totalTransactions}
                onExport={null} // TODO: Implement export feature
              />
            </FadeInItem>

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
