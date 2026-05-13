import React, { useState, useCallback } from 'react'
import Modal from '@/Components/common/Modal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'
import { Wallet } from 'lucide-react'

const AVULSA_TYPES = [
  { value: 'pix',        label: 'Pix',          icon: '⚡', gradient: 'from-teal-500 to-cyan-500'       },
  { value: 'freelance',  label: 'Freelance',    icon: '💻', gradient: 'from-violet-500 to-purple-600'   },
  { value: 'benefit',    label: 'Benefício',    icon: '🎁', gradient: 'from-pink-500 to-rose-500'       },
  { value: 'investment', label: 'Investimento', icon: '📈', gradient: 'from-emerald-500 to-green-500'   },
  { value: 'rental',     label: 'Aluguel',      icon: '🏠', gradient: 'from-amber-500 to-orange-500'    },
  { value: 'other',      label: 'Outro',        icon: '💰', gradient: 'from-blue-500 to-indigo-500'     },
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
  const [title, setTitle]                   = useState('')
  const [amount, setAmount]                 = useState('')
  const [type, setType]                     = useState('pix')
  const [receivedAt, setReceivedAt]         = useState(today())
  const [bankAccountId, setBankAccountId]   = useState('')
  const [description, setDescription]       = useState('')
  const [saving, setSaving]                 = useState(false)
  const [errors, setErrors]                 = useState({})

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

  const selectedType = AVULSA_TYPES.find((t) => t.value === type)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nova Entrada"
      description="Registre uma entrada pontual no seu controle financeiro."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 mt-4">

        {errors.general && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.general[0]}
          </div>
        )}

        {/* ── Type Grid ── */}
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Tipo de entrada
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {AVULSA_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-xs font-medium transition-all duration-200 ${
                  type === t.value
                    ? `bg-gradient-to-br ${t.gradient} text-white shadow-md scale-[1.03]`
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-[#151515]'
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="w-full truncate text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type[0]}</p>}
        </div>

        {/* ── Amount ── */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Valor recebido <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">
              R$
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3.5 pl-12 pr-4 text-xl font-semibold shadow-sm themed-focus placeholder:text-gray-300 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 dark:placeholder:text-gray-600"
            />
          </div>
          {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount[0]}</p>}
        </div>

        {/* ── Title ── */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Ex: ${selectedType?.label ?? 'Descrição da entrada'}…`}
            maxLength={255}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title[0]}</p>}
        </div>

        {/* ── Date + Bank Account ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Data de recebimento
            </label>
            <input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              max={today()}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            />
            {errors.received_at && <p className="mt-1 text-xs text-red-500">{errors.received_at[0]}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
              Creditar em conta
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Não creditar em conta</option>
              {bankAccountsList.map((ba) => (
                <option key={ba.id} value={ba.id}>
                  {ba.name}
                  {ba.balance !== undefined ? ` · R$ ${Number(ba.balance).toFixed(2).replace('.', ',')}` : ''}
                </option>
              ))}
            </select>
            {bankAccountId && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-3 w-3 flex-shrink-0" />
                O valor será adicionado ao saldo desta conta
              </p>
            )}
            {errors.bank_account_id && <p className="mt-1 text-xs text-red-500">{errors.bank_account_id[0]}</p>}
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
            Descrição{' '}
            <span className="text-[11px] font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre esta entrada…"
            rows={2}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          />
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 pt-1">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="text-white">
            {saving ? 'Salvando…' : 'Registrar Entrada'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
