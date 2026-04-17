import React, { useState, useCallback } from 'react'
import Modal from '@/Components/common/Modal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'
import { Wallet } from 'lucide-react'

const AVULSA_TYPES = [
  { value: 'pix',        label: 'Pix',         icon: '⚡' },
  { value: 'freelance',  label: 'Freelance',   icon: '💻' },
  { value: 'benefit',    label: 'Benefício',   icon: '🎁' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
  { value: 'rental',     label: 'Aluguel',     icon: '🏠' },
  { value: 'other',      label: 'Outro',       icon: '💰' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function QuickIncomeForm({
  isOpen,
  onClose,
  onSuccess,
  bankAccountsList = [],
}) {
  const [title, setTitle]               = useState('')
  const [amount, setAmount]             = useState('')
  const [type, setType]                 = useState('pix')
  const [receivedAt, setReceivedAt]     = useState(today())
  const [bankAccountId, setBankAccountId] = useState('')
  const [description, setDescription]  = useState('')
  const [saving, setSaving]             = useState(false)
  const [errors, setErrors]             = useState({})

  const resetForm = useCallback(() => {
    setTitle('')
    setAmount('')
    setType('pix')
    setReceivedAt(today())
    setBankAccountId('')
    setDescription('')
    setErrors({})
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose?.()
  }, [resetForm, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setErrors({})

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      amount: parseFloat(amount),
      type,
      is_recurring: false,
      // Entries via this form are one-time cash inflows, NOT active income sources.
      // is_active=false ensures they do not appear in income totals or active renda lists.
      is_active: false,
      received_at: receivedAt || null,
      bank_account_id: bankAccountId ? parseInt(bankAccountId, 10) : null,
      payment_day_type: 'fixed',
      payment_day_value: 1,
    }

    try {
      const response = await window.axios.post(route('incomes.store'), payload)
      onSuccess?.(response.data)
      handleClose()
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {})
      } else {
        setErrors({ general: ['Erro ao salvar. Tente novamente.'] })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cadastrar Entrada Avulsa"
      description="Registre uma entrada pontual e, se desejar, credite-a em uma conta bancária."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.general[0]}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Tipo de entrada
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AVULSA_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs font-medium transition-all border ${
                  type === t.value
                    ? 'themed-selected border-theme-accent ring-1 ring-theme-accent/30'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="truncate w-full text-center">{t.label}</span>
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Freelance de design"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              maxLength={255}
              required
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Valor (R$) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              required
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Data de recebimento
            </label>
            <input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              max={today()}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            />
            {errors.received_at && <p className="text-xs text-red-500 mt-1">{errors.received_at[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Conta bancária
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Sem crédito em conta</option>
              {bankAccountsList.map((ba) => (
                <option key={ba.id} value={ba.id}>
                  {ba.name}
                  {ba.balance !== undefined ? ` · R$ ${Number(ba.balance).toFixed(2).replace('.', ',')}` : ''}
                </option>
              ))}
            </select>
            {/* {bankAccountId && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                O valor será adicionado ao saldo desta conta.
              </p>
            )} */}
            {errors.bank_account_id && <p className="text-xs text-red-500 mt-1">{errors.bank_account_id[0]}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre esta entrada..."
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="text-white">
            {saving ? 'Salvando...' : 'Cadastrar Entrada'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
