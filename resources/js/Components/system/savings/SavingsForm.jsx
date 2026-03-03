import React, { useState, useEffect, useCallback } from 'react'
import Modal from '@/Components/common/Modal'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import SecondaryButton from '@/Components/common/buttons/SecondaryButton'

const ICON_OPTIONS = ['💰', '🐷', '🎯', '🏠', '🚗', '✈️', '📱', '💎', '🎓', '💊', '🎮', '🏖️', '🎁', '👶', '💍', '🏋️']

const COLOR_OPTIONS = ['#f43f5e', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#ef4444']

export default function SavingsForm({ isOpen, onClose, onSuccess, goal = null }) {
  const isEditing = !!goal

  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount ? String(goal.target_amount) : '')
  const [icon, setIcon] = useState(goal?.icon || '💰')
  const [color, setColor] = useState(goal?.color || '#f43f5e')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '')
      setDescription(goal.description || '')
      setTargetAmount(goal.target_amount ? String(goal.target_amount) : '')
      setIcon(goal.icon || '💰')
      setColor(goal.color || '#f43f5e')
    }
  }, [goal])

  const resetForm = useCallback(() => {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setTargetAmount('')
      setIcon('💰')
      setColor('#f43f5e')
    }
    setErrors({})
  }, [isEditing])

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
      target_amount: parseFloat(targetAmount),
      icon,
      color,
    }

    try {
      const url = isEditing ? route('savings.update', goal.id) : route('savings.store')
      const method = isEditing ? 'put' : 'post'
      const response = await window.axios[method](url, payload)

      const data = response.data
      onSuccess?.({
        ...data,
        progress: data.progress ?? (data.target_amount > 0
          ? Math.min(Math.round((data.current_amount / data.target_amount) * 100 * 10) / 10, 100)
          : 0),
        remaining: data.remaining ?? Math.max(data.target_amount - data.current_amount, 0),
        is_completed: data.is_completed ?? (data.completed_at !== null),
      })
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
      title={isEditing ? 'Editar Meta' : 'Nova Meta de Economia'}
      description={isEditing ? 'Atualize os dados da sua meta.' : 'Crie um pote para guardar e acompanhar seu dinheiro.'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {errors.general && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.general[0]}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fundo de emergência"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              maxLength={255}
              required
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Meta (R$)</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
              required
            />
            {errors.target_amount && <p className="text-xs text-red-500 mt-1">{errors.target_amount[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-base border transition ${
                    icon === ic
                      ? 'border-current shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={icon === ic ? { borderColor: 'var(--theme-accent, #f43f5e)' } : {}}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ring-1 ring-black/10 transition ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c, ringColor: color === c ? c : undefined }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para que é essa meta?"
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={handleClose}>Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="text-white">
            {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Meta'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  )
}
