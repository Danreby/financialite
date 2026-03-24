import React, { useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'
import ScrollArea from '@/Components/common/ScrollArea'
import Modal from '@/Components/common/Modal'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'
import IncomeForm from '@/Components/system/income/IncomeForm'
import IncomeCard from '@/Components/system/income/IncomeCard'
import ReceitasHeroCard from '@/Components/system/receitas/ReceitasHeroCard'
import ReceitasTypeBreakdown from '@/Components/system/receitas/ReceitasTypeBreakdown'
import ReceitasFilterBar from '@/Components/system/receitas/ReceitasFilterBar'

export default function ResumoReceitasTab({
  initialIncomes = [],
  initialTotal = 0,
  bankAccounts = [],
  bankAccountsList = [],
}) {
  const [incomes, setIncomes] = useState(initialIncomes)
  const [totalMonthly, setTotalMonthly] = useState(initialTotal)

  const incomesByType = useMemo(() => {
    const grouped = {}
    for (const i of incomes) {
      if (!grouped[i.type]) grouped[i.type] = []
      grouped[i.type].push(i)
    }
    return grouped
  }, [incomes])

  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [deletingIncome, setDeletingIncome] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const refreshTotals = (updatedIncomes) => {
    const active = updatedIncomes.filter(i => i.is_active)
    setTotalMonthly(active.reduce((s, i) => s + Number(i.amount || 0), 0))
  }

  const handleCreated = (income) => {
    const bankName = income.bank_user?.card?.name || income.bank_name || null
    const bankAccountName = income.bank_account?.bank?.name || income.bank_account_name || null
    const mapped = {
      ...income,
      amount: Number(income.amount),
      bank_name: bankName,
      bank_account_name: bankAccountName,
    }
    const updated = [...incomes, mapped]
    setIncomes(updated)
    refreshTotals(updated)
    setShowForm(false)
    toast.success('Renda cadastrada!')
  }

  const handleUpdated = (income) => {
    const bankName = income.bank_user?.card?.name || income.bank_name || null
    const updated = incomes.map(i => i.id === income.id ? { ...i, ...income, bank_name: bankName } : i)
    setIncomes(updated)
    refreshTotals(updated)
    setEditingIncome(null)
    toast.success('Renda atualizada!')
  }

  const handleToggle = async (income) => {
    try {
      const res = await axios.post(route('incomes.toggle', income.id))
      const updated = incomes.map(i => i.id === income.id ? { ...i, ...res.data } : i)
      setIncomes(updated)
      refreshTotals(updated)
      toast.success(res.data.is_active ? 'Renda ativada!' : 'Renda desativada!')
    } catch {
      toast.error('Erro ao alterar status.')
    }
  }

  const handleDelete = async () => {
    if (!deletingIncome || deleting) return
    setDeleting(true)
    try {
      await axios.delete(route('incomes.destroy', deletingIncome.id))
      const updated = incomes.filter(i => i.id !== deletingIncome.id)
      setIncomes(updated)
      refreshTotals(updated)
      setDeletingIncome(null)
      toast.success('Renda removida!')
    } catch {
      toast.error('Erro ao remover renda.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      if (filterType !== 'all' && income.type !== filterType) return false
      if (filterStatus === 'active' && !income.is_active) return false
      if (filterStatus === 'inactive' && income.is_active) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matches = (income.title || '').toLowerCase().includes(term)
          || (income.description || '').toLowerCase().includes(term)
          || (income.bank_name || '').toLowerCase().includes(term)
        if (!matches) return false
      }
      return true
    })
  }, [incomes, filterType, filterStatus, searchTerm])

  const activeCount = incomes.filter(i => i.is_active).length
  const inactiveCount = incomes.length - activeCount

  return (
    <>
      <FadeInContainer stagger className="flex flex-col gap-4 lg:gap-5">
        <FadeInContainer stagger className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          <FadeInItem className="lg:col-span-2">
            <ReceitasHeroCard
              totalMonthly={totalMonthly}
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              onAddNew={() => setShowForm(true)}
            />
          </FadeInItem>
          <FadeInItem>
            <ReceitasTypeBreakdown
              incomesByType={incomesByType}
              totalMonthly={totalMonthly}
            />
          </FadeInItem>
        </FadeInContainer>

        <FadeInItem>
          <ReceitasFilterBar
            filterType={filterType}
            filterStatus={filterStatus}
            searchTerm={searchTerm}
            onFilterType={setFilterType}
            onFilterStatus={setFilterStatus}
            onSearch={setSearchTerm}
            incomesByType={incomesByType}
          />
        </FadeInItem>

        <FadeInItem>
          <div className="themed-card rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                {filterType === 'all' ? 'Todas as receitas' : `Receitas: ${filterType}`}
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({filteredIncomes.length})</span>
              </h2>
            </div>

            {filteredIncomes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">💸</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {incomes.length === 0 ? 'Nenhuma renda cadastrada ainda.' : 'Nenhum resultado para o filtro selecionado.'}
                </p>
                {incomes.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-sm font-medium text-[var(--theme-accent)] hover:underline"
                  >
                    Cadastrar primeira renda
                  </button>
                )}
              </div>
            ) : (
              <ScrollArea maxHeightClassName="max-h-[500px] sm:max-h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredIncomes.map(income => (
                    <IncomeCard
                      key={income.id}
                      income={income}
                      onEdit={i => setEditingIncome(i)}
                      onToggle={handleToggle}
                      onDelete={i => setDeletingIncome(i)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </FadeInItem>
      </FadeInContainer>

      <IncomeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleCreated}
        bankAccounts={bankAccounts}
        bankAccountsList={bankAccountsList}
      />

      {editingIncome && (
        <IncomeForm
          isOpen={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          onSuccess={handleUpdated}
          bankAccounts={bankAccounts}
          bankAccountsList={bankAccountsList}
          income={editingIncome}
        />
      )}

      <Modal
        isOpen={!!deletingIncome}
        onClose={() => !deleting && setDeletingIncome(null)}
        title="Remover renda"
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tem certeza que deseja remover <strong>{deletingIncome?.title}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <SecondaryButton onClick={() => setDeletingIncome(null)} disabled={deleting}>
            Cancelar
          </SecondaryButton>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </Modal>
    </>
  )
}
