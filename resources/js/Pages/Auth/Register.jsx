import React, { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import GuestLayout from '@/Layouts/GuestLayout'
import NeumorphicCard from '@/Components/auth/NeumorphicCard'
import NeumorphicField from '@/Components/auth/NeumorphicField'
import AuthAlert from '@/Components/auth/AuthAlert'
import GoogleButton from '@/Components/auth/GoogleButton'
import PasswordToggleButton from '@/Components/auth/PasswordToggleButton'
import useGoogleAuth from '@/Hooks/useGoogleAuth'
import useAuthErrors from '@/Hooks/useAuthErrors'

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
  const { isGoogleOnly, isDuplicateGoogle, isDuplicateEmail, emailMessage, humanizeError } = useAuthErrors(errors)

  const emailHasInlineAlert = isDuplicateGoogle || isDuplicateEmail

  useEffect(() => {
    if (!Object.keys(errors).length) return

    if (emailHasInlineAlert) return

    if (errors.email) {
      toast.error(emailMessage ?? getErrorMessage(errors.email))
    } else if (errors.password) {
      toast.error(humanizeError(errors.password))
    } else if (errors.name) {
      toast.error(getErrorMessage(errors.name))
    } else {
      toast.error('Por favor, corrija os erros no formulário.')
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
    <>
      <Head title="Criar conta" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto px-4"
      >
        <NeumorphicCard className="flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 tracking-tight">
            Criar conta
          </h1>
          <p className="text-gray-400 text-sm mb-8">Cadastre-se para começar</p>

          <GoogleButton
            onClick={triggerGoogleLogin}
            isLoading={googleLoading}
            label="Cadastrar com Google"
            disabled={processing}
          />

          <p className="text-gray-400 text-sm mt-6 mb-7 font-medium opacity-80">
            ou use seus dados
          </p>

          <motion.form
            onSubmit={submit}
            className="w-full space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            noValidate
          >
            <NeumorphicField
              id="name"
              label="Nome"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
              autoComplete="name"
              autoFocus
              type="text"
            />

            <AuthAlert
              variant="warning"
              show={isDuplicateGoogle}
              message="Este email já tem uma conta Google vinculada."
              action={{ label: 'Entrar com Google →', href: route('login') }}
            />
            <AuthAlert
              variant="info"
              show={isDuplicateEmail && !isDuplicateGoogle}
              message="Este email já está cadastrado."
              action={{ label: 'Fazer login →', href: route('login') }}
            />

            <NeumorphicField
              id="email"
              label="E-mail"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={emailHasInlineAlert ? null : errors.email}
              autoComplete="username"
              type="email"
            />

            <NeumorphicField
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
              inputMode="tel"
            />

            <NeumorphicField
              id="password"
              label="Senha"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              type={showPassword ? 'text' : 'password'}
              rightElement={
                <PasswordToggleButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              }
            />

            <NeumorphicField
              id="password_confirmation"
              label="Confirmar senha"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              error={errors.password_confirmation}
              autoComplete="new-password"
              type={showPasswordConfirmation ? 'text' : 'password'}
              rightElement={
                <PasswordToggleButton
                  visible={showPasswordConfirmation}
                  onToggle={() => setShowPasswordConfirmation((prev) => !prev)}
                  labelShow="Mostrar confirmação de senha"
                  labelHide="Ocultar confirmação de senha"
                />
              }
            />

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={processing}
                className="w-full max-w-[220px] py-3.5 rounded-full text-white font-bold text-sm tracking-widest uppercase transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b1e]"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-accent, #f43f5e), var(--theme-primary, #be123c))',
                  boxShadow: '0 4px 15px color-mix(in srgb, var(--theme-accent, #f43f5e) 40%, transparent)',
                }}
              >
                {processing ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </motion.form>

          <div className="mt-7 pt-4 border-t border-white/5 text-center text-sm text-gray-400 w-full">
            <span>Já tem conta? </span>
            <Link href={route('login')} className="underline text-gray-200 hover:text-white ml-1">
              Entrar
            </Link>
          </div>
        </NeumorphicCard>
      </motion.div>
    </>
  )
}

Register.layout = (page) => <GuestLayout bgClassName="bg-[#1e1b1e] text-gray-100">{page}</GuestLayout>
