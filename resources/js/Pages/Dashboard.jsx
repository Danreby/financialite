import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Head } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { CreditCard, ArrowDownLeft, Wallet, Banknote, CalendarClock } from 'lucide-react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import StatCard from '@/Components/system/dashboard/StatCard'
import QuickActions from '@/Components/system/dashboard/QuickActions'
import MonthlySummaryChart from '@/Components/system/dashboard/MonthlySummaryChart'
import TopSpendingCategories from '@/Components/system/dashboard/TopSpendingCategories'
import BudgetProgress from '@/Components/system/dashboard/BudgetProgress'
import UpcomingBills from '@/Components/system/dashboard/UpcomingBills'
import SpendingTrends from '@/Components/system/dashboard/SpendingTrends'
import FinancialHealthScore from '@/Components/system/dashboard/FinancialHealthScore'
import CategoryBadge from '@/Components/common/CategoryBadge'
import { formatCurrencyBRL } from '@/Lib/formatters'
import FaturaDetailModal from '@/Components/system/fatura/FaturaDetailModal'
import BillForm from '@/Components/system/BillForm'
import BudgetForm from '@/Components/system/BudgetForm'
import BillPaymentForm from '@/Components/system/BillPaymentForm'
import ScrollArea from '@/Components/common/ScrollArea'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export default function Dashboard({ bankAccounts = [], categories = [] }) {
  const [currentFilters, setCurrentFilters] = useState({})
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState(null)
  const [recentFaturas, setRecentFaturas] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [topSpendingCategories, setTopSpendingCategories] = useState([])
  const [topSpendingLabel, setTopSpendingLabel] = useState('Mês vigente')
  const [selectedFaturaItem, setSelectedFaturaItem] = useState(null)
  const [recurringSpending, setRecurringSpending] = useState({ total: 0, percentage: 0 })
  const [nonRecurringSpending, setNonRecurringSpending] = useState({ total: 0, percentage: 0 })

  const [selectedMonthKey, setSelectedMonthKey] = useState(null)
  const [monthData, setMonthData] = useState(null)
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)
  const [dashboardInsights, setDashboardInsights] = useState(null)
  const [showBillForm, setShowBillForm] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [currentBudget, setCurrentBudget] = useState(null)
  const [isLoadingBudget, setIsLoadingBudget] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [payingBill, setPayingBill] = useState(null)

  const handleMonthClick = useCallback(async (monthKey) => {
    let shouldFetchData = true

    setSelectedMonthKey((prevKey) => {
      if (prevKey === monthKey) {
        setMonthData(null)
        shouldFetchData = false
        return null
      }
      return monthKey
    })

    if (!shouldFetchData) return

    setIsLoadingMonth(true)

    try {
      const params = {
        month_from: monthKey,
        month_to: monthKey,
      }

      if (currentFilters.bank_user_id) params.bank_user_id = currentFilters.bank_user_id
      if (currentFilters.category_id) params.category_id = currentFilters.category_id

      const response = await axios.get(route('transacoes.top_spending_by_period'), { params })
      setMonthData(response.data || {})
    } catch (err) {
      console.error('Error fetching month data:', err)
      toast.error('Erro ao carregar dados do mês.')
      setSelectedMonthKey(null)
      setMonthData(null)
    } finally {
      setIsLoadingMonth(false)
    }
  }, [currentFilters])

  const handleClearSelection = useCallback(() => {
    setSelectedMonthKey(null)
    setMonthData(null)
  }, [])

  const activeTopSpending = monthData?.top_spending_categories ?? topSpendingCategories
  const activeTopSpendingLabel = monthData?.period_label ?? topSpendingLabel
  const activeRecurring = monthData?.recurring_spending ?? recurringSpending
  const activeNonRecurring = monthData?.non_recurring_spending ?? nonRecurringSpending

  const [stats, setStats] = useState([])

  const handleBankFilterChange = (event) => {
    const value = event.target.value || undefined
    setCurrentFilters((prev) => ({
      ...prev,
      bank_user_id: value,
    }))
    setPage(1)
    setSelectedMonthKey(null)
    setMonthData(null)
  }

  const handleBillSuccess = () => {
    setShowBillForm(false)
    setEditingBill(null)
    setReloadKey((prev) => prev + 1)
  }

  const handleBudgetSuccess = () => {
    setShowBudgetForm(false)
    setCurrentBudget(null)
    setReloadKey((prev) => prev + 1)
  }

  const handleBillPayClick = (bill) => {
    setPayingBill(bill)
  }

  const handleBillEditClick = (bill) => {
    setEditingBill(bill)
    setShowBillForm(true)
  }

  const handleBillToggle = async (bill) => {
    try {
      await axios.patch(route('bills.toggle', bill.id))
      toast.success('Status da conta alterado com sucesso.')
      setReloadKey((prev) => prev + 1)
    } catch (error) {
      toast.error('Erro ao alterar status da conta.')
    }
  }

  const handlePaymentSuccess = () => {
    setPayingBill(null)
    setReloadKey((prev) => prev + 1)
  }

  const handleOpenBudgetForm = async () => {
    setIsLoadingBudget(true)
    try {
      const response = await axios.get(route('budgets.current'))
      setCurrentBudget(response.data)
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading budget:', error)
        toast.error('Erro ao carregar orçamento atual.')
      }
      setCurrentBudget(null)
    } finally {
      setIsLoadingBudget(false)
      setShowBudgetForm(true)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const [faturasResponse, statsResponse, insightsResponse] = await Promise.all([
          axios.get(route('transacoes.index'), { params: { ...currentFilters, page } }),
          axios.get(route('transacoes.stats'), { params: { ...currentFilters } }),
          axios.get(route('transacoes.insights'), { params: { ...currentFilters } }),
        ])

        const payload = faturasResponse.data || {}
        setData(payload)

        const faturas = payload.data || []
        setRecentFaturas(faturas)

        const statsPayload = statsResponse.data || {}

        const currentMonthDebitTotal = Number(statsPayload.current_month_debit_total || 0)
        const remainingMoney = Number(statsPayload.remaining_money || 0)
        const totalMonthlyIncome = Number(statsPayload.total_monthly_income || 0)

        const monthlySummaryPayload = Array.isArray(statsPayload.monthly_summary)
          ? statsPayload.monthly_summary
          : []

        const topSpendingPayload = Array.isArray(statsPayload.top_spending_categories)
          ? statsPayload.top_spending_categories
          : []
        const topSpendingLabelPayload = statsPayload.top_spending_label || 'Mês vigente'

        const currentMonthPendingBill = Number(statsPayload.current_month_pending_bill || 0)
        const currentMonthLabel = statsPayload.current_month_label || 'Mês atual'

        const totalMonthlySpent = currentMonthPendingBill + currentMonthDebitTotal

        const nextDueInfo = statsPayload.next_card_due_date ?? null
        const nearestDue = nextDueInfo?.nearest ?? null

        const buildDueDateCard = () => {
          if (!nearestDue) {
            return {
              id: 5,
              title: 'Próximo vencimento',
              value: '—',
              delta: 'Nenhum cartão pendente',
              deltaVariant: 'neutral',
              icon: CalendarClock,
            }
          }

          const days = nearestDue.days_until_due
          const value =
            days === 0
              ? 'Hoje'
              : days === 1
              ? 'Amanhã'
              : `${days} dias`

          const allCards = nextDueInfo?.cards ?? []
          const delta = allCards.length > 1
            ? `${nearestDue.card_name} +${allCards.length - 1}`
            : nearestDue.card_name

          const deltaVariant =
            days === 0 ? 'danger' : days <= 3 ? 'warning' : 'neutral'

          return {
            id: 5,
            title: 'Próximo vencimento',
            value,
            delta,
            deltaVariant,
            icon: 5,
          }
        }

        setStats([
          {
            id: 1,
            title: 'Fatura Atual',
            value: formatCurrencyBRL(currentMonthPendingBill),
            delta: currentMonthLabel,
            icon: 1,
          },
          {
            id: 2,
            title: 'Transações no débito',
            value: formatCurrencyBRL(currentMonthDebitTotal),
            delta: '',
            icon: 4,
          },
          {
            id: 3,
            title: 'Total Mensal',
            value: formatCurrencyBRL(totalMonthlySpent),
            delta: '',
            icon: 3,
          },
          {
            id: 4,
            title: 'Dinheiro restante',
            value: formatCurrencyBRL(remainingMoney),
            delta: totalMonthlyIncome > 0
              ? `Renda: ${formatCurrencyBRL(totalMonthlyIncome)}`
              : 'Sem renda cadastrada',
            icon: 2,
          },
          buildDueDateCard(),
        ])

        setMonthlySummary(monthlySummaryPayload)

        const totalTopSpending = topSpendingPayload.reduce(
          (acc, item) => acc + Number(item.total || 0),
          0,
        )

        const normalizedTopSpending = totalTopSpending > 0
          ? topSpendingPayload.map((item) => ({
              ...item,
              share: Math.max(
                5,
                Math.round((Number(item.total || 0) / totalTopSpending) * 100),
              ),
            }))
          : topSpendingPayload

        setTopSpendingCategories(normalizedTopSpending)
        setTopSpendingLabel(topSpendingLabelPayload)

        setRecurringSpending({
          total: Number(statsPayload.recurring_spending?.total || 0),
          percentage: Number(statsPayload.recurring_spending?.percentage || 0),
        })

        setNonRecurringSpending({
          total: Number(statsPayload.non_recurring_spending?.total || 0),
          percentage: Number(statsPayload.non_recurring_spending?.percentage || 0),
        })

        setDashboardInsights(insightsResponse.data || null)
      } catch (error) {
        console.error(error)
        if (error.response?.data?.message) {
          toast.error(error.response.data.message)
        } else {
          toast.error('Não foi possível carregar os dados do dashboard.')
        }
      }
    })()
  }, [currentFilters, page, reloadKey])

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <FadeInContainer className="w-full max-w-[1920px] mx-auto pb-6">
        <FadeInItem className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Visão geral
          </h1>

          <div className="flex items-center gap-2 text-sm lg:text-base">
            <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
              Banco do dashboard
            </label>
            <select
              value={currentFilters.bank_user_id || ''}
              onChange={handleBankFilterChange}
              className="min-w-[260px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Todos os bancos</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.due_day ? ` - vence dia ${account.due_day}` : ''}
                </option>
              ))}
            </select>
          </div>
        </FadeInItem>

        <FadeInContainer stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          {stats.map((stat) => (
            <FadeInItem key={stat.id} type="feature">
              <StatCard
                title={stat.title}
                value={stat.value}
                delta={stat.delta}
                icon={stat.icon}
                deltaVariant={stat.deltaVariant}
              />
            </FadeInItem>
          ))}
        </FadeInContainer>

        <FadeInContainer stagger className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <FadeInItem className="lg:col-span-2 themed-card rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100">
                Transações recentes
              </h2>
              <span className="text-xs text-gray-600 dark:text-gray-400">Últimos lançamentos</span>
            </div>

            <ScrollArea maxHeightClassName="max-h-[260px]" className="space-y-3 pr-1">
              {recentFaturas && recentFaturas.length > 0 ? (
                recentFaturas.slice(0, 5).map((fatura) => {
                  const isDebit = fatura.type === 'debit'
                  const labelDate = formatDateLabel(fatura.created_at)
                  const bankName = fatura.bank_user?.card?.name
                  const category = fatura.category
                  const categoryName = category?.name
                  const categoryIcon = category?.icon
                  const categoryColor = category?.color
                  const typeLabel = isDebit ? 'Débito' : 'Crédito'
                  const subtitleParts = [typeLabel]
                  if (bankName) subtitleParts.push(bankName)
                  if (labelDate) subtitleParts.push(labelDate)

                  const handleClick = () => {
                    setSelectedFaturaItem({
                      title: fatura.title,
                      description: fatura.description,
                      amount: fatura.amount,
                      type: fatura.type,
                      status: fatura.status,
                      created_at: fatura.created_at,
                      paid_date: fatura.paid_date,
                      total_installments: fatura.total_installments,
                      current_installment: fatura.current_installment,
                      display_installment: null,
                      is_recurring: fatura.is_recurring,
                      bank_name: bankName,
                      category_name: categoryName,
                      category_icon: categoryIcon,
                      category_color: categoryColor,
                    })
                  }

                  return (
                    <Transaction
                      key={fatura.id}
                      title={fatura.title}
                      subtitle={subtitleParts.join(' • ')}
                      value={`${formatCurrencyBRL(fatura.amount)}`}
                      negative={isDebit}
                      onClick={handleClick}
                      categoryName={categoryName}
                      categoryIcon={categoryIcon}
                      categoryColor={categoryColor}
                    />
                  )
                })
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nenhuma transação recente encontrada.
                </p>
              )}
            </ScrollArea>
          </FadeInItem>

          <FadeInItem>
            <QuickActions
              bankAccounts={bankAccounts}
              categories={categories}
              onTransactionCreated={() => setReloadKey((prev) => prev + 1)}
            />
          </FadeInItem>
        </FadeInContainer>

        <FadeInContainer stagger className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <FadeInItem className="lg:col-span-2 themed-card rounded-2xl overflow-hidden">
            <MonthlySummaryChart
              data={monthlySummary}
              onMonthClick={handleMonthClick}
              selectedMonthKey={selectedMonthKey}
            />
          </FadeInItem>

          <FadeInItem>
            <TopSpendingCategories
              data={activeTopSpending}
              label={activeTopSpendingLabel}
              recurringSpending={activeRecurring}
              nonRecurringSpending={activeNonRecurring}
              isLoading={isLoadingMonth}
              hasSelection={!!selectedMonthKey}
              onClearSelection={handleClearSelection}
            />
          </FadeInItem>
        </FadeInContainer>

        <FadeInContainer stagger className="mt-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          <FadeInItem className="lg:col-span-1 xl:col-span-1">
            <FinancialHealthScore
              score={dashboardInsights?.financial_health?.score ?? 0}
              factors={dashboardInsights?.financial_health?.factors ?? {
                savingsRate: 0,
                budgetAdherence: 0,
                debtRatio: 0,
                emergencyFund: 0,
                recurringControl: 0,
                paymentDiscipline: 0,
              }}
            />
          </FadeInItem>

          <FadeInItem className="lg:col-span-1 xl:col-span-1">
            <BudgetProgress
              totalBudget={dashboardInsights?.budget_progress?.total_budget ?? 0}
              totalSpent={dashboardInsights?.budget_progress?.total_spent ?? 0}
              budgets={dashboardInsights?.budget_progress?.budgets ?? []}
              onConfigureClick={handleOpenBudgetForm}
            />
          </FadeInItem>

          <FadeInItem className="lg:col-span-1 xl:col-span-1">
            <UpcomingBills
              bills={dashboardInsights?.upcoming_bills ?? []}
              onPayClick={handleBillPayClick}
              onEditClick={handleBillEditClick}
              onAddClick={() => {
                setEditingBill(null)
                setShowBillForm(true)
              }}
              onToggleClick={handleBillToggle}
            />
          </FadeInItem>

          <FadeInItem className="lg:col-span-1 xl:col-span-1">
            <SpendingTrends
              currentMonth={dashboardInsights?.spending_trends?.current_month ?? 0}
              previousMonth={dashboardInsights?.spending_trends?.previous_month ?? 0}
              threeMonthAvg={dashboardInsights?.spending_trends?.three_month_avg ?? 0}
              categoryTrends={dashboardInsights?.spending_trends?.category_trends ?? []}
            />
          </FadeInItem>
        </FadeInContainer>

        <FaturaDetailModal
          isOpen={!!selectedFaturaItem}
          onClose={() => setSelectedFaturaItem(null)}
          item={selectedFaturaItem}
        />

        <BillForm
          isOpen={showBillForm}
          onClose={() => {
            setShowBillForm(false)
            setEditingBill(null)
          }}
          onSuccess={handleBillSuccess}
          categories={categories}
          bill={editingBill}
        />

        <BillPaymentForm
          isOpen={!!payingBill}
          onClose={() => setPayingBill(null)}
          onSuccess={handlePaymentSuccess}
          bill={payingBill}
        />

        <BudgetForm
          isOpen={showBudgetForm}
          onClose={() => {
            setShowBudgetForm(false)
            setCurrentBudget(null)
          }}
          onSuccess={handleBudgetSuccess}
          categories={categories}
          budget={currentBudget}
        />
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}

function Transaction({ title, subtitle, value, negative, onClick, categoryName, categoryIcon, categoryColor }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900/30 cursor-pointer"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm lg:text-base font-medium text-gray-900 dark:text-gray-200">{title}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
          {categoryName && (
            <CategoryBadge
              name={categoryName}
              icon={categoryIcon}
              color={categoryColor}
              size="sm"
            />
          )}
        </div>
      </div>
      <div className="text-sm lg:text-base font-semibold text-theme-accent">
        {value}
      </div>
    </div>
  )
}
