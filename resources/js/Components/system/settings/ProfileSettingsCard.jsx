import React, { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import FloatLabelField from '@/Components/common/inputs/FloatLabelField'

export default function ProfileSettingsCard({ user, itemVariants }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await axios.put(route('profile.update'), { name, email })
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        toast.error('Erro ao atualizar perfil.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-lg shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-6 mb-6">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Informações Pessoais
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div variants={itemVariants}>
          <FloatLabelField
            id="name"
            name="name"
            type="text"
            label="Nome Completo"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
            }}
            error={errors.name}
            isRequired
            isDisabled={loading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </motion.div>

        <motion.div variants={itemVariants}>
          <FloatLabelField
            id="email"
            name="email"
            type="email"
            label="E-mail"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
            }}
            error={errors.email}
            isRequired
            isDisabled={loading}
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="pt-4">
          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </PrimaryButton>
        </motion.div>
      </form>
    </div>
  )
}
