import React, { useState, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Head } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'
import ResumoSummaryCards from '@/Components/system/resumo/ResumoSummaryCards'
import ResumoIncomeSection from '@/Components/system/resumo/ResumoIncomeSection'
import ResumoExpensesByCategory from '@/Components/system/resumo/ResumoExpensesByCategory'
import ResumoCalendar from '@/Components/system/resumo/ResumoCalendar'
import ResumoExpensesByCard from '@/Components/system/resumo/ResumoExpensesByCard'
import ResumoExpensesByBank from '@/Components/system/resumo/ResumoExpensesByBank'
import ResumoCategoryAverages from '@/Components/system/resumo/ResumoCategoryAverages'

function getMonthKey(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatMonthLabel(monthKey) {
  if (!monthKey) return ''
  const [y, m] = monthKey.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

export default function ResumoMensal({ bankAccounts = [], bankAccountsList = [], categories = [] }) {
  const [monthKey, setMonthKey] = useState(getMonthKey(0))
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const monthLabel = useMemo(() => formatMonthLabel(monthKey), [monthKey])

  const fetchData = useCallback(async (key) => {
    setIsLoading(true)
    try {
      const response = await axios.get(route('resumo-mensal.data'), {
        params: { month_key: key },
      })
      setData(response.data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar resumo mensal.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(monthKey)
  }, [monthKey, fetchData])

  const handlePrevMonth = useCallback(() => {
    setMonthKey(prev => {
      const [y, m] = prev.split('-').map(Number)
      const d = new Date(y, m - 2, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setMonthKey(prev => {
      const [y, m] = prev.split('-').map(Number)
      const d = new Date(y, m, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [])

  return (
    <AuthenticatedLayout>
      <Head title="Resumo Mensal" />

      <FadeInContainer className="w-full max-w-[1920px] mx-auto pb-8">
        <FadeInItem type="fast">
          <header className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Resumo Mensal
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Visão completa das suas finanças no mês
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="min-w-[160px] text-center text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 capitalize">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </header>
        </FadeInItem>

        {isLoading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-[var(--theme-accent)] rounded-full animate-spin" />
          </div>
        )}

        {data && (
          <>
            <FadeInItem type="subtle">
              <ResumoSummaryCards summary={data.summary} isLoading={isLoading} />
            </FadeInItem>

            <FadeInContainer stagger className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
              <FadeInItem className="lg:col-span-2">
                <ResumoIncomeSection incomes={data.incomes} />
              </FadeInItem>
              <FadeInItem>
                <ResumoExpensesByCategory expenses={data.expenses_by_category} />
              </FadeInItem>
            </FadeInContainer>

            <FadeInItem className="mt-5">
              <ResumoCalendar days={data.calendar} monthKey={monthKey} />
            </FadeInItem>

            <FadeInContainer stagger className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              <FadeInItem>
                <ResumoExpensesByCard cards={data.expenses_by_card} />
              </FadeInItem>
              <FadeInItem>
                <ResumoExpensesByBank banks={data.expenses_by_bank} />
              </FadeInItem>
            </FadeInContainer>

            <FadeInItem className="mt-5">
              <ResumoCategoryAverages averages={data.category_averages} />
            </FadeInItem>
          </>
        )}
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}
