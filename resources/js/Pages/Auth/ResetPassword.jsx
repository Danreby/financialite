import React, { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import GuestLayout from '@/Layouts/GuestLayout'
import AuthCard from '@/Components/auth/AuthCard'
import AuthAlert from '@/Components/auth/AuthAlert'
import FormField from '@/Components/auth/FormField'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import EyeIcon from '@/Components/common/icons/EyeIcon'

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token:                 token,
    email:                 email,
    password:              '',
    password_confirmation: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const submit = (e) => {
    e.preventDefault()
    post(route('password.store'), {
      onFinish: () => reset('password', 'password_confirmation'),
      onError:  () => toast.error('Verifique os campos e tente novamente.'),
    })
  }

  return (
    <GuestLayout>
      <Head title="Redefinir senha" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto px-4"
      >
        <AuthCard>
          <div className="px-6 pt-8 pb-2 sm:px-8 flex flex-col items-center text-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.35, type: 'spring', stiffness: 200 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)] shadow-lg shadow-rose-900/30"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-white"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </motion.div>

            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-100 leading-tight">
                Redefinir senha
              </h1>
              <p className="mt-1.5 text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                Escolha uma nova senha segura para a sua conta.
              </p>
            </div>
          </div>

          <motion.form
            onSubmit={submit}
            className="space-y-5 px-6 sm:px-8 pt-4 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            noValidate
          >
            <AuthAlert
              variant="error"
              show={!!errors.token || !!errors.email}
              message={errors.token ?? errors.email ?? 'Link de redefinição inválido ou expirado. Solicite um novo.'}
            />

            <FormField
              id="password"
              label="Nova senha"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              autoFocus
              type={showPassword ? 'text' : 'password'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-200 focus:outline-none mt-3"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon type={showPassword ? 1 : 2} />
                </button>
              }
            />

            <FormField
              id="password_confirmation"
              label="Confirmar nova senha"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              error={errors.password_confirmation}
              autoComplete="new-password"
              type={showConfirm ? 'text' : 'password'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-gray-400 hover:text-gray-200 focus:outline-none mt-3"
                  aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                >
                  <EyeIcon type={showConfirm ? 1 : 2} />
                </button>
              }
            />

            <PrimaryButton
              type="submit"
              className="w-full justify-center"
              disabled={processing}
            >
              {processing ? 'Redefinindo...' : 'Redefinir senha'}
            </PrimaryButton>
          </motion.form>
        </AuthCard>
      </motion.div>
    </GuestLayout>
  )
}
