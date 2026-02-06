import React, { useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import SavingsCard from './SavingsCard'
import SavingsForm from './SavingsForm'
import SavingsTransactionModal from './SavingsTransactionModal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'
import DangerButton from '@/Components/common/buttons/DangerButton'
import ScrollArea from '@/Components/common/ScrollArea'
import Modal from '@/Components/common/Modal'
import { formatCurrencyBRL } from '@/Lib/formatters'

export default function SavingsSection({
  savingsGoals: initialGoals = [],
  savingsSummary: initialSummary = {},
}) {
  const [goals, setGoals] = useState(initialGoals)
  const [summary, setSummary] = useState(initialSummary)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [deletingGoal, setDeletingGoal] = useState(null)
  const [transactionGoal, setTransactionGoal] = useState(null)
  const [transactionType, setTransactionType] = useState('deposit')
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const handleCloseForm = useCallback(() => setShowForm(false), [])
  const handleCloseEdit = useCallback(() => setEditingGoal(null), [])
  const handleCloseDelete = useCallback(() => setDeletingGoal(null), [])
  const handleCloseTransaction = useCallback(() => setTransactionGoal(null), [])

  const refreshSummary = (updatedGoals) => {
    const active = updatedGoals.filter((g) => g.is_active)
    const totalMontante = active.filter((g) => g.type === 'montante').reduce((s, g) => s + Number(g.current_amount || 0), 0)
    const totalPorquinho = active.filter((g) => g.type === 'porquinho').reduce((s, g) => s + Number(g.current_amount || 0), 0)
    setSummary({
      ...summary,
      total_saved: totalMontante + totalPorquinho,
      total_montante: totalMontante,
      total_porquinho: totalPorquinho,
      active_count: active.length,
    })
  }

  const handleCreated = (goal) => {
    const updated = [goal, ...goals]
    setGoals(updated)
    refreshSummary(updated)
    toast.success('Meta criada!')
  }

  const handleUpdated = (goal) => {
    const updated = goals.map((g) => (g.id === goal.id ? { ...g, ...goal } : g))
    setGoals(updated)
    refreshSummary(updated)
    setEditingGoal(null)
    toast.success('Meta atualizada!')
  }

  const handleTransaction = async (goalId, amount, type) => {
    try {
      const url = type === 'deposit'
        ? route('savings.deposit', goalId)
        : route('savings.withdraw', goalId)

      const res = await axios.post(url, { amount })
      const updated = goals.map((g) => (g.id === goalId ? {
        ...g,
        ...res.data,
        progress: res.data.target_amount > 0
          ? Math.min(Math.round((res.data.current_amount / res.data.target_amount) * 100 * 10) / 10, 100)
          : 0,
        remaining: Math.max(res.data.target_amount - res.data.current_amount, 0),
        is_completed: res.data.completed_at !== null,
      } : g))
      setGoals(updated)
      refreshSummary(updated)
      setTransactionGoal(null)
      toast.success(type === 'deposit' ? 'Depósito realizado!' : 'Retirada realizada!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro na operação.')
    }
  }

  const handleDelete = async () => {
    if (!deletingGoal || deleting) return
    setDeleting(true)
    try {
      await axios.delete(route('savings.destroy', deletingGoal.id))
      const updated = goals.filter((g) => g.id !== deletingGoal.id)
      setGoals(updated)
      refreshSummary(updated)
      setDeletingGoal(null)
      toast.success('Meta removida!')
    } catch {
      toast.error('Erro ao remover meta.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredGoals = activeTab === 'all'
    ? goals
    : goals.filter((g) => g.type === activeTab)

  const montanteCount = goals.filter((g) => g.type === 'montante').length
  const porquinhoCount = goals.filter((g) => g.type === 'porquinho').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Metas de Economia
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total guardado:{' '}
            <span className="font-semibold" style={{ color: 'var(--theme-accent, #22c55e)' }}>
              {formatCurrencyBRL(summary.total_saved || 0)}
            </span>
            {' · '}{summary.active_count || 0} meta(s) ativa(s)
          </p>
        </div>
        <PrimaryButton onClick={() => setShowForm(true)} className="text-white !text-xs sm:!text-sm">
          + Nova Meta
        </PrimaryButton>
      </div>

      {/* Summary cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              💰 Montantes
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrencyBRL(summary.total_montante || 0)}
            </p>
            <p className="text-[10px] text-gray-400">{montanteCount} meta(s)</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              🐷 Porquinhos
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrencyBRL(summary.total_porquinho || 0)}
            </p>
            <p className="text-[10px] text-gray-400">{porquinhoCount} meta(s)</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {goals.length > 0 && (
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-[11px] dark:bg-gray-900/50 w-fit">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'montante', label: '💰 Montantes' },
            { key: 'porquinho', label: '🐷 Porquinhos' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md border text-[11px] transition-colors ${
                activeTab === tab.key
                  ? 'text-white border-transparent'
                  : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
              style={activeTab === tab.key ? { backgroundColor: 'var(--theme-primary, #7b1818)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Goals list */}
      {filteredGoals.length > 0 ? (
        <ScrollArea maxHeightClassName="max-h-[400px]">
          <div className="space-y-3">
            {filteredGoals.map((goal) => (
              <SavingsCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => setEditingGoal(g)}
                onDelete={(g) => setDeletingGoal(g)}
                onDeposit={(g) => { setTransactionGoal(g); setTransactionType('deposit') }}
                onWithdraw={(g) => { setTransactionGoal(g); setTransactionType('withdraw') }}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-3xl mb-2">🎯</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma meta de economia cadastrada ainda.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Crie montantes para guardar dinheiro ou porquinhos para metas específicas.
          </p>
        </div>
      )}

      {/* Create form */}
      <SavingsForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handleCreated}
      />

      {/* Edit form */}
      {editingGoal && (
        <SavingsForm
          isOpen={!!editingGoal}
          onClose={handleCloseEdit}
          onSuccess={handleUpdated}
          goal={editingGoal}
        />
      )}

      {/* Transaction modal */}
      {transactionGoal && (
        <SavingsTransactionModal
          isOpen={!!transactionGoal}
          onClose={handleCloseTransaction}
          goal={transactionGoal}
          type={transactionType}
          onConfirm={handleTransaction}
        />
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deletingGoal}
        onClose={handleCloseDelete}
        title="Remover meta"
        description="Tem certeza que deseja remover esta meta de economia?"
        maxWidth="sm"
      >
        <div className="mt-4 flex justify-end gap-3">
          <SecondaryButton onClick={handleCloseDelete}>Cancelar</SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Removendo...' : 'Remover'}
          </DangerButton>
        </div>
      </Modal>
    </div>
  )
}
