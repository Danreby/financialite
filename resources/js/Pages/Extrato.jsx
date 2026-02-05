import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { toast } from 'react-toastify'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ExtratoFilters from '@/Components/system/extrato/ExtratoFilters'
import ExtratoSummary from '@/Components/system/extrato/ExtratoSummary'
import ExtratoDayGroup from '@/Components/system/extrato/ExtratoDayGroup'
import ExtratoIncomeBar from '@/Components/system/extrato/ExtratoIncomeBar'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'

function formatDateInput(date) {
  return date.toISOString().split('T')[0]
}

export default function Extrato({ bankAccounts = [], categories = [] }) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  const [startDate, setStartDate] = useState(formatDateInput(firstDay))
  const [endDate, setEndDate] = useState(formatDateInput(now))
  const [bankUserId, setBankUserId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState('')

  const [transactions, setTransactions] = useState([])
  const [incomes, setIncomes] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        bank_user_id: bankUserId || undefined,
        category_id: categoryId || undefined,
        type: type || undefined,
      }

      const response = await axios.get(route('extrato.data'), { params })
      const data = response.data || {}

      setTransactions(data.transactions || [])
      setIncomes(data.incomes || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar extrato.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, bankUserId, categoryId, type])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClear = () => {
    const resetFirst = new Date(now.getFullYear(), now.getMonth(), 1)
    setStartDate(formatDateInput(resetFirst))
    setEndDate(formatDateInput(now))
    setBankUserId('')
    setCategoryId('')
    setType('')
  }

  const totalTransactions = useMemo(() => {
    return transactions.reduce((sum, group) => sum + (group.transactions?.length || 0), 0)
  }, [transactions])

  return (
    <AuthenticatedLayout>
      <Head title="Extrato" />

      <FadeInContainer type="container" stagger className="space-y-4 sm:space-y-6">
        {/* Header */}
        <FadeInItem type="item">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Extrato
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Visão detalhada de todas as suas movimentações financeiras.
            </p>
          </div>
        </FadeInItem>

        {/* Filtros */}
        <FadeInItem type="item">
          <ExtratoFilters
            startDate={startDate}
            endDate={endDate}
            bankUserId={bankUserId}
            categoryId={categoryId}
            type={type}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onBankChange={setBankUserId}
            onCategoryChange={setCategoryId}
            onTypeChange={setType}
            onClear={handleClear}
            bankAccounts={bankAccounts}
            categories={categories}
          />
        </FadeInItem>

        {/* Rendas */}
        <FadeInItem type="item">
          <ExtratoIncomeBar incomes={incomes} />
        </FadeInItem>

        {/* Summary */}
        {summary && (
          <FadeInItem type="item">
            <ExtratoSummary summary={summary} />
          </FadeInItem>
        )}

        {/* Timeline de transações */}
        <FadeInItem type="item">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0b0b0b] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Movimentações
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalTransactions} {totalTransactions === 1 ? 'transação' : 'transações'}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Carregando extrato...</span>
                </div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/50 max-h-[60vh] overflow-y-auto scrollbar-custom">
                {transactions.map((group) => (
                  <ExtratoDayGroup key={group.date} group={group} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <span className="text-4xl mb-3">📄</span>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Nenhuma movimentação encontrada
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                  Ajuste os filtros de data ou categoria para encontrar suas transações.
                </p>
              </div>
            )}
          </div>
        </FadeInItem>
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}
