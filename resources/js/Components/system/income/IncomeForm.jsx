import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from '@/Components/common/Modal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

const INCOME_TYPES = [
  { value: 'salary', label: 'Salário', icon: '💼' },
  { value: 'freelance', label: 'Freelance', icon: '💻' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
  { value: 'rental', label: 'Aluguel', icon: '🏠' },
  { value: 'benefit', label: 'Benefício', icon: '🎁' },
  { value: 'other', label: 'Outro', icon: '💰' },
]

const PAYMENT_DAY_TYPES = [
  { value: 'fixed', label: 'Dia fixo do mês' },
  { value: 'business_day', label: 'Dia útil do mês' },
]

export default function IncomeForm({
  isOpen,
  onClose,
  onSuccess,
  bankAccounts = [],
  income = null,
}) {
  const isEditing = !!income

  const [title, setTitle] = useState(income?.title || '')
  const [description, setDescription] = useState(income?.description || '')
  const [amount, setAmount] = useState(income?.amount ? String(income.amount) : '')
  const [type, setType] = useState(income?.type || 'salary')
  const [paymentDayType, setPaymentDayType] = useState(income?.payment_day_type || 'fixed')
  const [paymentDayValue, setPaymentDayValue] = useState(income?.payment_day_value ? String(income.payment_day_value) : '1')
  const [bankUserId, setBankUserId] = useState(income?.bank_user_id ? String(income.bank_user_id) : '')
  const [isActive, setIsActive] = useState(income?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const resetForm = () => {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setAmount('')
      setType('salary')
      setPaymentDayType('fixed')
      setPaymentDayValue('1')
      setBankUserId('')
      setIsActive(true)
    }
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose?.()
  }

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
      payment_day_type: paymentDayType,
      payment_day_value: parseInt(paymentDayValue, 10),
      is_active: isActive,
      bank_user_id: bankUserId ? parseInt(bankUserId, 10) : null,
    }

    try {
      const url = isEditing
        ? route('incomes.update', income.id)
        : route('incomes.store')

      const method = isEditing ? 'put' : 'post'

      const response = await window.axios[method](url, payload)
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
      title={isEditing ? 'Editar Renda' : 'Nova Renda'}
      description={isEditing ? 'Atualize os dados da sua fonte de renda.' : 'Cadastre uma nova fonte de renda.'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.general[0]}
          </div>
        )}

        {/* Tipo - cards selecionáveis */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Tipo de renda
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {INCOME_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs font-medium transition-all border ${
                  type === t.value
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-500/60 ring-1 ring-rose-500/30'
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

        {/* Título e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Salário CLT"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              maxLength={255}
              required
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Valor (R$)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              required
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
          </div>
        </div>

        {/* Dia de pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Tipo de dia</label>
            <select
              value={paymentDayType}
              onChange={(e) => setPaymentDayType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              {PAYMENT_DAY_TYPES.map((pd) => (
                <option key={pd.value} value={pd.value}>{pd.label}</option>
              ))}
            </select>
            {errors.payment_day_type && <p className="text-xs text-red-500 mt-1">{errors.payment_day_type[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              {paymentDayType === 'fixed' ? 'Dia do mês' : 'Nº do dia útil'}
            </label>
            <input
              type="number"
              value={paymentDayValue}
              onChange={(e) => setPaymentDayValue(e.target.value)}
              min={1}
              max={paymentDayType === 'fixed' ? 31 : 25}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              required
            />
            {errors.payment_day_value && <p className="text-xs text-red-500 mt-1">{errors.payment_day_value[0]}</p>}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre esta renda..."
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 resize-none"
          />
        </div>

        {/* Banco e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Conta bancária (opcional)</label>
            <select
              value={bankUserId}
              onChange={(e) => setBankUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
            >
              <option value="">Nenhuma</option>
              {bankAccounts.map((ba) => (
                <option key={ba.id} value={ba.id}>{ba.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Renda ativa</span>
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={handleClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="text-white">
            {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
