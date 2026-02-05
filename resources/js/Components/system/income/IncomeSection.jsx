import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import IncomeCard from './IncomeCard'
import IncomeForm from './IncomeForm'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import ScrollArea from '@/Components/common/ScrollArea'
import { formatCurrencyBRL } from '@/Lib/formatters'
import Modal from '@/Components/common/Modal'
import DangerButton from '@/Components/common/buttons/DangerButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

export default function IncomeSection({
  incomes: initialIncomes = [],
  totalMonthlyIncome: initialTotal = 0,
  bankAccounts = [],
}) {
  const [incomes, setIncomes] = useState(initialIncomes)
  const [totalMonthly, setTotalMonthly] = useState(initialTotal)
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [deletingIncome, setDeletingIncome] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refreshTotal = (updatedIncomes) => {
    const total = updatedIncomes
      .filter((i) => i.is_active)
      .reduce((sum, i) => sum + Number(i.amount || 0), 0)
    setTotalMonthly(total)
  }

  const handleCreated = (income) => {
    const updated = [...incomes, income]
    setIncomes(updated)
    refreshTotal(updated)
    toast.success('Renda cadastrada!')
  }

  const handleUpdated = (income) => {
    const updated = incomes.map((i) => (i.id === income.id ? { ...i, ...income } : i))
    setIncomes(updated)
    refreshTotal(updated)
    setEditingIncome(null)
    toast.success('Renda atualizada!')
  }

  const handleToggle = async (income) => {
    try {
      const res = await axios.post(route('incomes.toggle', income.id))
      const updated = incomes.map((i) => (i.id === income.id ? { ...i, ...res.data } : i))
      setIncomes(updated)
      refreshTotal(updated)
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
      const updated = incomes.filter((i) => i.id !== deletingIncome.id)
      setIncomes(updated)
      refreshTotal(updated)
      setDeletingIncome(null)
      toast.success('Renda removida!')
    } catch {
      toast.error('Erro ao remover renda.')
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = incomes.filter((i) => i.is_active).length

  return (
    <div className="space-y-4">
      {/* Header com total */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Fontes de Renda
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeCount} {activeCount === 1 ? 'ativa' : 'ativas'} · Total mensal:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrencyBRL(totalMonthly)}
            </span>
          </p>
        </div>
        <PrimaryButton onClick={() => setShowForm(true)} className="text-white !text-xs sm:!text-sm">
          + Nova Renda
        </PrimaryButton>
      </div>

      {/* Lista de incomes */}
      {incomes.length > 0 ? (
        <ScrollArea maxHeightClassName="max-h-[360px] sm:max-h-[400px]">
          <div className="space-y-3">
            {incomes.map((income) => (
              <IncomeCard
                key={income.id}
                income={income}
                onEdit={(i) => setEditingIncome(i)}
                onToggle={handleToggle}
                onDelete={(i) => setDeletingIncome(i)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">💸</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma renda cadastrada ainda.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Cadastre seus salários, freelances e outras fontes de renda.
          </p>
        </div>
      )}

      {/* Form de criação */}
      <IncomeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleCreated}
        bankAccounts={bankAccounts}
      />

      {/* Form de edição */}
      {editingIncome && (
        <IncomeForm
          isOpen={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          onSuccess={handleUpdated}
          bankAccounts={bankAccounts}
          income={editingIncome}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={!!deletingIncome}
        onClose={() => setDeletingIncome(null)}
        title="Remover renda"
        description="Tem certeza que deseja remover esta fonte de renda?"
        maxWidth="sm"
      >
        <div className="mt-4 flex justify-end gap-3">
          <SecondaryButton onClick={() => setDeletingIncome(null)}>
            Cancelar
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removendo...' : 'Remover'}
          </DangerButton>
        </div>
      </Modal>
    </div>
  )
}
