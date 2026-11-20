import { useCallback, useState } from 'react'
import axios from 'axios'
import { Head } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { Plus } from 'lucide-react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Button, PageHeader, Select } from '@/Components/ui'
import DashboardKpis from '@/Components/system/dashboard/DashboardKpis'
import SpendingChart from '@/Components/system/dashboard/SpendingChart'
import MonthAlerts from '@/Components/system/dashboard/MonthAlerts'
import RecentActivity from '@/Components/system/dashboard/RecentActivity'
import MonthlyForecastCard from '@/Components/system/dashboard/MonthlyForecastCard'
import QuickActions from '@/Components/system/dashboard/QuickActions'
import TopSpendingCategories from '@/Components/system/dashboard/TopSpendingCategories'
import BudgetProgress from '@/Components/system/dashboard/BudgetProgress'
import UpcomingBills from '@/Components/system/dashboard/UpcomingBills'
import FinancialHealthScore from '@/Components/system/dashboard/FinancialHealthScore'
import SpendingTrends from '@/Components/system/dashboard/SpendingTrends'
import FaturaDetailModal from '@/Components/system/fatura/FaturaDetailModal'
import BillForm from '@/Components/system/BillForm'
import BudgetForm from '@/Components/system/BudgetForm'
import BillPaymentForm from '@/Components/system/BillPaymentForm'
import { useNewTransaction } from '@/Components/system/transactions/NewTransactionProvider'
import useDashboardData from '@/Hooks/useDashboardData'
import { toDetailItem } from '@/Lib/dashboard'

// Fica dentro do AuthenticatedLayout, onde está o NewTransactionProvider.
function NewTransactionButton() {
  const { openNewTransaction } = useNewTransaction()
  return (
    <Button icon={Plus} onClick={openNewTransaction} className="w-full sm:w-auto">
      Nova transação
    </Button>
  )
}

export default function Dashboard({ bankAccounts = [], categories = [] }) {
  const dashboard = useDashboardData()
  const { loading, stats, insights, transactions, reload } = dashboard

  const [detailItem, setDetailItem] = useState(null)
  const [payingBill, setPayingBill] = useState(null)
  const [billForm, setBillForm] = useState({ open: false, bill: null })
  const [budgetForm, setBudgetForm] = useState({ open: false, budget: null })
  const [loadingBudget, setLoadingBudget] = useState(false)

  const done = useCallback(
    (close) => () => {
      close()
      reload()
    },
    [reload],
  )

  const toggleBill = async (bill) => {
    try {
      await axios.patch(route('bills.toggle', bill.id))
      toast.success('Status da conta alterado.')
      reload()
    } catch {
      toast.error('Não foi possível alterar o status da conta.')
    }
  }

  const openBudgetForm = async () => {
    setLoadingBudget(true)
    let budget = null
    try {
      budget = (await axios.get(route('budgets.current'))).data
    } catch (error) {
      if (error.response?.status !== 404) toast.error('Não foi possível carregar o orçamento atual.')
    } finally {
      setLoadingBudget(false)
      setBudgetForm({ open: true, budget })
    }
  }

  const monthLabel = stats?.current_month_label

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 pb-6 xl:gap-5">
        <PageHeader
          title="Visão geral"
          subtitle={monthLabel ? `Como está ${monthLabel}: gastos, contas e alertas.` : 'Gastos, contas e alertas do mês.'}
          className="pt-1"
          actions={
            <>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <label htmlFor="dashboard-cartao" className="shrink-0 text-sm font-medium text-content-secondary">
                  Cartão
                </label>
                <div className="min-w-0 flex-1 sm:w-60 sm:flex-none">
                  <Select id="dashboard-cartao" value={dashboard.cardId} onChange={(e) => dashboard.changeCard(e.target.value)}>
                    <option value="">Todos os cartões</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                        {account.due_day ? ` (vence dia ${account.due_day})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <NewTransactionButton />
            </>
          }
        />

        <DashboardKpis stats={stats} loading={loading} />

        <div className="grid gap-4 xl:grid-cols-12 xl:gap-5">
          <div className="flex min-w-0 flex-col gap-4 xl:col-span-8 xl:gap-5">
            <SpendingChart data={stats?.monthly_summary ?? []} loading={loading} selectedMonth={dashboard.selectedMonth} onMonthClick={dashboard.toggleMonth} />
            <RecentActivity transactions={transactions} loading={loading} onOpen={(tx) => setDetailItem(toDetailItem(tx))} />
          </div>
          <div className="min-w-0 xl:relative xl:col-span-4">
            <MonthAlerts stats={stats} insights={insights} loading={loading} onPayBill={setPayingBill} className="flex flex-col xl:absolute xl:inset-0" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12 xl:gap-5">
          <MonthlyForecastCard stats={stats} loading={loading} className="xl:col-span-7" />
          <QuickActions categories={categories} onChanged={reload} className="xl:col-span-5" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          <TopSpendingCategories
            stats={stats}
            monthData={dashboard.monthData}
            months={stats?.monthly_summary ?? []}
            selectedMonth={dashboard.selectedMonth}
            onSelectMonth={dashboard.selectMonth}
            loading={loading}
            monthLoading={dashboard.monthLoading}
          />
          <BudgetProgress progress={insights?.budget_progress} loading={loading || loadingBudget} onConfigure={openBudgetForm} />
          <UpcomingBills
            bills={insights?.upcoming_bills ?? []}
            loading={loading}
            onPay={setPayingBill}
            onEdit={(bill) => setBillForm({ open: true, bill })}
            onAdd={() => setBillForm({ open: true, bill: null })}
            onToggle={toggleBill}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12 xl:gap-5">
          <FinancialHealthScore health={insights?.financial_health} loading={loading} className="xl:col-span-7" />
          <SpendingTrends trends={insights?.spending_trends} loading={loading} className="xl:col-span-5" />
        </div>
      </div>

      <FaturaDetailModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        bankAccounts={bankAccounts}
        categories={categories}
        onUpdated={done(() => setDetailItem(null))}
      />
      <BillForm
        isOpen={billForm.open}
        onClose={() => setBillForm({ open: false, bill: null })}
        onSuccess={done(() => setBillForm({ open: false, bill: null }))}
        categories={categories}
        bill={billForm.bill}
      />
      <BillPaymentForm isOpen={!!payingBill} onClose={() => setPayingBill(null)} onSuccess={done(() => setPayingBill(null))} bill={payingBill} />
      <BudgetForm
        isOpen={budgetForm.open}
        onClose={() => setBudgetForm({ open: false, budget: null })}
        onSuccess={done(() => setBudgetForm({ open: false, budget: null }))}
        categories={categories}
        budget={budgetForm.budget}
      />
    </AuthenticatedLayout>
  )
}
