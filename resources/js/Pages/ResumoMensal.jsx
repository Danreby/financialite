import React, { useState, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Head, router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  CreditCard,
  CalendarDays,
  Calculator,
  Loader2,
} from 'lucide-react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'

import ResumoSummaryCards from '@/Components/system/resumo/ResumoSummaryCards'
import ResumoIncomeSection from '@/Components/system/resumo/ResumoIncomeSection'
import ResumoExpensesByCategory from '@/Components/system/resumo/ResumoExpensesByCategory'
import ResumoCalendar from '@/Components/system/resumo/ResumoCalendar'
import ResumoExpensesByCard from '@/Components/system/resumo/ResumoExpensesByCard'
import ResumoExpensesByBank from '@/Components/system/resumo/ResumoExpensesByBank'
import ResumoCategoryAverages from '@/Components/system/resumo/ResumoCategoryAverages'
import CalendarSummaryPanel from '@/Components/system/resumo/CalendarSummaryPanel'

import ResumoReceitasTab from '@/Components/system/resumo/ResumoReceitasTab'
import ResumoPrevisaoTab from '@/Components/system/resumo/ResumoPrevisaoTab'

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

const TABS = [
  { id: 'overview',  label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'receitas',  label: 'Receitas',    icon: Wallet },
  { id: 'despesas',  label: 'Despesas',    icon: CreditCard },
  { id: 'previsao',  label: 'Previsão Mensal', icon: Calculator },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
]

const tabVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function ResumoMensal({
  bankAccounts = [],
  bankAccountsList = [],
  categories = [],
  incomes: initialIncomes = [],
  totalMonthly: initialTotal = 0,
}) {
  const [monthKey, setMonthKey] = useState(getMonthKey(0))
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('overview')
  const [tabDirection, setTabDirection] = useState(0)

  const [previsaoData, setPrevisaoData] = useState(null)
  const [previsaoLoading, setPrevisaoLoading] = useState(false)

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

  useEffect(() => {
    if (activeTab !== 'previsao') return

    let cancelled = false

    setPrevisaoLoading(true)
    axios.get(route('resumo-mensal.previsao'), { params: { month_key: monthKey } })
      .then((response) => {
        if (!cancelled) setPrevisaoData(response.data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) toast.error('Erro ao carregar previsão mensal.')
      })
      .finally(() => {
        if (!cancelled) setPrevisaoLoading(false)
      })

    return () => { cancelled = true }
  }, [monthKey, activeTab])

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

  const handleTabChange = (tabId) => {
    const currentIdx = TABS.findIndex(t => t.id === activeTab)
    const nextIdx = TABS.findIndex(t => t.id === tabId)
    setTabDirection(nextIdx > currentIdx ? 1 : -1)
    setActiveTab(tabId)
  }

  return (
    <AuthenticatedLayout>
      <Head title="Resumo Mensal" />

      <div className="w-full max-w-[1920px] mx-auto pb-8">
        <FadeInContainer>
          <FadeInItem type="fast">
            <header className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                    Resumo Mensal
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Visão completa das suas finanças
                  </p>
                </div>

                <div className="flex items-center gap-1 themed-card rounded-xl px-1 py-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="min-w-[140px] sm:min-w-[160px] text-center text-sm font-medium text-gray-900 dark:text-gray-100 capitalize select-none">
                    {monthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <nav className="flex gap-1 p-1 rounded-xl themed-card overflow-x-auto scrollbar-custom" role="tablist">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
                        ${isActive
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-bg"
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.12 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10 hidden sm:block" />
                      <span className="relative z-10">{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-indicator"
                          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--theme-accent)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </nav>
            </header>
          </FadeInItem>
        </FadeInContainer>

        <AnimatePresence>
          {isLoading && !data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-accent)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {data && (
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={tabDirection}>
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  custom={tabDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <OverviewTab data={data} isLoading={isLoading} />
                </motion.div>
              )}

              {activeTab === 'receitas' && (
                <motion.div
                  key="receitas"
                  custom={tabDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <ResumoReceitasTab
                    initialIncomes={initialIncomes}
                    initialTotal={initialTotal}
                    bankAccounts={bankAccounts}
                    bankAccountsList={bankAccountsList}
                  />
                </motion.div>
              )}

              {activeTab === 'despesas' && (
                <motion.div
                  key="despesas"
                  custom={tabDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <DespesasTab data={data} isLoading={isLoading} />
                </motion.div>
              )}

              {activeTab === 'previsao' && (
                <motion.div
                  key="previsao"
                  custom={tabDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <PrevisaoTab data={previsaoData} isLoading={previsaoLoading} />
                </motion.div>
              )}

              {activeTab === 'calendario' && (
                <motion.div
                  key="calendario"
                  custom={tabDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <CalendarioTab data={data} monthKey={monthKey} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

function OverviewTab({ data, isLoading }) {
  return (
    <FadeInContainer stagger className="flex flex-col gap-4 lg:gap-5">
      <FadeInItem>
        <ResumoSummaryCards summary={data.summary} isLoading={isLoading} />
      </FadeInItem>

      <FadeInContainer stagger className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <FadeInItem className="lg:col-span-2">
          <ResumoIncomeSection incomes={data.incomes} />
        </FadeInItem>
        <FadeInItem>
          <ResumoExpensesByCategory expenses={data.expenses_by_category} />
        </FadeInItem>
      </FadeInContainer>

      <FadeInItem>
        <ResumoCategoryAverages averages={data.category_averages} />
      </FadeInItem>
    </FadeInContainer>
  )
}

function DespesasTab({ data, isLoading }) {
  return (
    <FadeInContainer stagger className="flex flex-col gap-4 lg:gap-5">
      <FadeInItem>
        <ResumoSummaryCards summary={data.summary} isLoading={isLoading} />
      </FadeInItem>

      <FadeInItem>
        <ResumoExpensesByCategory expenses={data.expenses_by_category} />
      </FadeInItem>

      <FadeInContainer stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <FadeInItem>
          <ResumoExpensesByCard cards={data.expenses_by_card} />
        </FadeInItem>
        <FadeInItem>
          <ResumoExpensesByBank banks={data.expenses_by_bank} />
        </FadeInItem>
      </FadeInContainer>

      <FadeInItem>
        <ResumoCategoryAverages averages={data.category_averages} />
      </FadeInItem>
    </FadeInContainer>
  )
}

function PrevisaoTab({ data, isLoading }) {
  return (
    <FadeInContainer stagger className="flex flex-col gap-4 lg:gap-5">
      <FadeInItem>
        <ResumoPrevisaoTab data={data} isLoading={isLoading} />
      </FadeInItem>
    </FadeInContainer>
  )
}

function CalendarioTab({ data, monthKey }) {
  return (
    <FadeInContainer stagger className="flex flex-col gap-4 lg:gap-5">
      <FadeInContainer stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <FadeInItem>
          <ResumoCalendar days={data.calendar} monthKey={monthKey} />
        </FadeInItem>
        <FadeInItem>
          <CalendarSummaryPanel data={data} />
        </FadeInItem>
      </FadeInContainer>
    </FadeInContainer>
  )
}
