import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePage, router } from '@inertiajs/react'
import axios from 'axios'
import { toast } from 'react-toastify'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import GoogleButton from '@/Components/auth/GoogleButton'
import useGoogleAuth from '@/Hooks/useGoogleAuth'

export default function GoogleSettingsCard({ itemVariants }) {
  const { auth } = usePage().props
  const isLinked = auth.user?.google_linked
  const hasPassword = auth.user?.has_password
  const avatar = auth.user?.avatar

  const [unlinking, setUnlinking] = useState(false)
  const { triggerGoogleLogin, isLoading: linking } = useGoogleAuth('link')

  const handleUnlink = async () => {
    if (!hasPassword) {
      toast.error('Defina uma senha antes de desvincular o Google.')
      return
    }

    setUnlinking(true)
    try {
      const response = await axios.delete(route('google.unlink'))
      toast.success(response.data?.message || 'Conta Google desvinculada!')
      router.reload({ only: ['auth'] })
    } catch (error) {
      const msg =
        error?.response?.data?.message || 'Erro ao desvincular conta Google.'
      toast.error(msg)
    } finally {
      setUnlinking(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-md themed-card p-6 mt-2">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-theme-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Conta Google
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Vincule sua conta Google para fazer login de forma rápida e segura
        </p>
      </div>

      {isLinked ? (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            {avatar && (
              <img
                src={avatar}
                alt="Avatar Google"
                className="w-10 h-10 rounded-full ring-2 ring-emerald-500/30"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Conta Google vinculada
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Você pode fazer login usando sua conta Google
              </p>
            </div>
          </div>

          <div className="pt-2">
            {!hasPassword && (
              <p className="text-xs text-amber-400 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Defina uma senha antes de desvincular o Google
              </p>
            )}
            <button
              onClick={handleUnlink}
              disabled={unlinking || !hasPassword}
              className={`
                w-full inline-flex items-center justify-center gap-2
                rounded-lg px-4 py-2.5 text-sm font-medium
                border transition-colors duration-150
                ${
                  hasPassword
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                    : 'border-gray-700 text-gray-500 cursor-not-allowed'
                }
                disabled:opacity-50
              `}
            >
              {unlinking ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              )}
              {unlinking ? 'Desvinculando...' : 'Desvincular conta Google'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-500/5 border border-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300">Nenhuma conta vinculada</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Vincule para acessar rapidamente sem digitar senha
              </p>
            </div>
          </div>

          <div className="pt-2">
            <GoogleButton
              onClick={triggerGoogleLogin}
              isLoading={linking}
              label="Vincular conta Google"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
