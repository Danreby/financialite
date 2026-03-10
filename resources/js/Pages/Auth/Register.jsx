import React, { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import GuestLayout from '@/Layouts/GuestLayout'
import AuthCard from '@/Components/auth/AuthCard'
import AuthHeader from '@/Components/auth/AuthHeader'
import FormField from '@/Components/auth/FormField'
import GoogleButton from '@/Components/auth/GoogleButton'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
import EyeIcon from '@/Components/common/icons/EyeIcon'
import useGoogleAuth from '@/Hooks/useGoogleAuth'

const errorMessages = {
  'validation.unique': 'Este email já está cadastrado.',
  'validation.email': 'Por favor, insira um email válido.',
  'validation.required': 'Este campo é obrigatório.',
  'validation.min.string': 'A senha deve ter pelo menos 8 caracteres.',
  'validation.confirmed': 'As senhas não conferem.',
}

const getErrorMessage = (error) => {
  if (!error) return null
  return errorMessages[error] || error
}

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const { triggerGoogleLogin, isLoading: googleLoading } = useGoogleAuth('login')

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      if (errors.email?.includes('unique') || errors.email?.includes('cadastrado')) {
        toast.error('Este email já está cadastrado. Tente fazer login ou use outro email.')
      } else if (errors.email) {
        toast.error(getErrorMessage(errors.email))
      } else if (errors.password) {
        toast.error(getErrorMessage(errors.password))
      } else if (errors.name) {
        toast.error(getErrorMessage(errors.name))
      } else {
        toast.error('Por favor, corrija os erros no formulário.')
      }
    }
  }, [errors])

  const submit = (e) => {
    e.preventDefault()
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
      onSuccess: () => {
        toast.success('Conta criada com sucesso! Verifique seu email.')
      },
      onError: () => {
      },
    })
  }

  return (
    <GuestLayout>
      <Head title="Criar conta" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto px-4"
      >
        <AuthCard>
          <div className="mb-2 pt-2 px-2">
            <AuthHeader title="Criar conta" subtitle="Cadastre-se para começar" />
          </div>

          <motion.form
            onSubmit={submit}
            className="space-y-6 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <FormField
              id="name"
              label="Nome"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
              autoComplete="name"
              autoFocus
              type="text"
            />

            <FormField
              id="email"
              label="E-mail"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
              autoComplete="username"
              type="email"
            />

            <FormField
              id="phone"
              label="Telefone (opcional)"
              value={data.phone}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 11)
                let formatted = raw
                if (raw.length > 6) {
                  formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
                } else if (raw.length > 2) {
                  formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`
                } else if (raw.length > 0) {
                  formatted = `(${raw}`
                }
                setData('phone', formatted)
              }}
              error={errors.phone}
              autoComplete="tel"
              type="tel"
            />

            <FormField
              id="password"
              label="Senha"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              type={showPassword ? 'text' : 'password'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-200 focus:outline-none mt-3"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon type={showPassword ? 1 : 2} />
                </button>
              }
            />

            <FormField
              id="password_confirmation"
              label="Confirmar senha"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              error={errors.password_confirmation}
              autoComplete="new-password"
              type={showPasswordConfirmation ? 'text' : 'password'}
              rightElement={
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirmation((prev) => !prev)
                  }
                  className="text-gray-400 hover:text-gray-200 focus:outline-none mt-3"
                  aria-label={
                    showPasswordConfirmation
                      ? 'Ocultar confirmação de senha'
                      : 'Mostrar confirmação de senha'
                  }
                  title={
                    showPasswordConfirmation
                      ? 'Ocultar confirmação de senha'
                      : 'Mostrar confirmação de senha'
                  }
                >
                  <EyeIcon type={showPasswordConfirmation ? 1 : 2} />
                </button>
              }
            />

            <div>
              <PrimaryButton type="submit" disabled={processing} className="w-full">
                Cadastrar
              </PrimaryButton>
            </div>
          </motion.form>

          {/* Google OAuth divider */}
          <div className="flex items-center gap-3 my-5 px-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Google button */}
          <div className="px-4">
            <GoogleButton
              onClick={triggerGoogleLogin}
              isLoading={googleLoading}
              label="Cadastrar com Google"
              disabled={processing}
            />
          </div>

          <div className="mt-6 border-t border-gray-800 pt-4 text-center text-sm text-gray-400 pb-4">
            <span>Já tem conta? </span>
            <Link href={route('login')} className="underline text-gray-200 ml-1">
              Entrar
            </Link>
          </div>
        </AuthCard>
      </motion.div>
    </GuestLayout>
  )
}
