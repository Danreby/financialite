import React, { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import FloatLabelField from '@/Components/common/inputs/FloatLabelField'

export default function SecuritySettingsCard({ itemVariants }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.currentPassword) newErrors.currentPassword = 'Senha atual é obrigatória'
    if (!formData.newPassword) newErrors.newPassword = 'Nova senha é obrigatória'
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = 'Nova senha deve ter no mínimo 8 caracteres'
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não correspondem'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await axios.put(route('password.update'), {
        current_password: formData.currentPassword,
        password: formData.newPassword,
        password_confirmation: formData.confirmPassword,
      })
      toast.success('Senha alterada com sucesso!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        toast.error('Erro ao alterar senha.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-rose-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Segurança
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Altere sua senha regularmente para manter sua conta segura
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={itemVariants}>
          <FloatLabelField
            id="currentPassword"
            name="currentPassword"
            type="password"
            label="Senha Atual"
            value={formData.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            isRequired
            isDisabled={loading}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <FloatLabelField
            id="newPassword"
            name="newPassword"
            type="password"
            label="Nova Senha"
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            isRequired
            isDisabled={loading}
            helperText="Mínimo de 8 caracteres"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FloatLabelField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirmar Nova Senha"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            isRequired
            isDisabled={loading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="pt-4">
          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg"
          >
            {loading ? 'Atualizando...' : 'Alterar Senha'}
          </PrimaryButton>
        </motion.div>
      </form>
    </div>
  )
}
