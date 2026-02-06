import React, { useState, useCallback } from 'react'
import Modal from '@/Components/common/Modal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)

export default function SavingsTransactionModal({ isOpen, onClose, onSuccess, goal, type = 'deposit' }) {
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const isDeposit = type === 'deposit'
  const maxWithdraw = goal ? parseFloat(goal.current_amount) : 0
  const remaining = goal ? parseFloat(goal.target_amount) - parseFloat(goal.current_amount) : 0

  const handleClose = useCallback(() => {
    setAmount('')
    setError(null)
    onClose?.()
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (processing) return

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Insira um valor válido.')
      return
    }

    if (!isDeposit && parsedAmount > maxWithdraw) {
      setError('Valor maior que o saldo disponível.')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const endpoint = isDeposit
        ? route('savings.deposit', goal.id)
        : route('savings.withdraw', goal.id)

      const response = await window.axios.post(endpoint, { amount: parsedAmount })
      const data = response.data

      onSuccess?.({
        ...data,
        progress: data.target_amount > 0
          ? Math.min(Math.round((data.current_amount / data.target_amount) * 100 * 10) / 10, 100)
          : 0,
        remaining: Math.max(data.target_amount - data.current_amount, 0),
        is_completed: data.completed_at !== null,
        type_label: data.type === 'montante' ? 'Montante' : 'Porquinho',
      })
      handleClose()
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = err.response.data.errors?.amount
        setError(msgs ? msgs[0] : 'Valor inválido.')
      } else {
        setError('Erro ao processar. Tente novamente.')
      }
    } finally {
      setProcessing(false)
    }
  }

  if (!goal) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isDeposit ? 'Depositar' : 'Retirar'}
      description={`${isDeposit ? 'Adicione dinheiro em' : 'Retire dinheiro de'} "${goal.title}"`}
      maxWidth="sm"
    >
      <div className="mt-4 space-y-4">
        {/* Goal summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-[#0f0f0f]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{goal.icon || (goal.type === 'montante' ? '💰' : '🐷')}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{goal.title}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span>Saldo: <strong className="text-gray-700 dark:text-gray-200">{formatCurrency(goal.current_amount)}</strong></span>
                <span>•</span>
                <span>Meta: {formatCurrency(goal.target_amount)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${goal.progress ?? 0}%`,
                  backgroundColor: goal.color || 'var(--theme-primary, #e11d48)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-400">
              <span>{goal.progress ?? 0}%</span>
              <span>Falta {formatCurrency(remaining > 0 ? remaining : 0)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              max={!isDeposit ? maxWithdraw : undefined}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-rose-500 focus:ring-rose-500 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              autoFocus
              required
            />
            {!isDeposit && (
              <p className="text-[10px] text-gray-400 mt-1">Máximo disponível: {formatCurrency(maxWithdraw)}</p>
            )}
            {isDeposit && remaining > 0 && (
              <p className="text-[10px] text-gray-400 mt-1">Faltam {formatCurrency(remaining)} para completar a meta</p>
            )}
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {(isDeposit ? [50, 100, 200, 500] : [50, 100, maxWithdraw]).map((val) => (
              val > 0 && (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  {val === maxWithdraw ? 'Tudo' : formatCurrency(val)}
                </button>
              )
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <SecondaryButton type="button" onClick={handleClose}>Cancelar</SecondaryButton>
            <PrimaryButton type="submit" disabled={processing} className="text-white">
              {processing
                ? 'Processando...'
                : isDeposit
                  ? '💰 Depositar'
                  : '💸 Retirar'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}
