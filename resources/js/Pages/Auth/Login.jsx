import React, { useRef, useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import GuestLayout from '@/Layouts/GuestLayout'
import NeumorphicCard from '@/Components/auth/NeumorphicCard'
import NeumorphicField from '@/Components/auth/NeumorphicField'
import AuthAlert from '@/Components/auth/AuthAlert'
import GoogleButton from '@/Components/auth/GoogleButton'
import EyeIcon from '@/Components/common/icons/EyeIcon'
import useGoogleAuth from '@/Hooks/useGoogleAuth'
import useAuthErrors from '@/Hooks/useAuthErrors'

const errorMessages = {
  'auth.failed': 'Email ou senha incorretos.',
  'auth.throttle': 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  'validation.required': 'Este campo é obrigatório.',
  'validation.email': 'Por favor, insira um email válido.',
}

const getErrorMessage = (error) => {
  if (!error) return null
  if (error.toLowerCase().includes('credentials') || error.toLowerCase().includes('incorretos') || error.toLowerCase().includes('failed')) {
    return 'Email ou senha incorretos.'
  }
  if (error.toLowerCase().includes('throttle') || error.toLowerCase().includes('tentativas')) {
    return 'Muitas tentativas de login. Tente novamente em alguns minutos.'
  }
  return errorMessages[error] || error
}

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const googleButtonRef = useRef(null)
  const { triggerGoogleLogin, isLoading: googleLoading } = useGoogleAuth('login')
  const { isGoogleOnly, isThrottle, emailMessage, humanizeError } = useAuthErrors(errors)

  useEffect(() => {
    if (status) toast.success(status)
  }, [status])

  useEffect(() => {
    if (!Object.keys(errors).length) return
    if (isGoogleOnly || isThrottle) return

    if (errors.email) {
      toast.error(emailMessage ?? getErrorMessage(errors.email))
    } else if (errors.password) {
      toast.error(getErrorMessage(errors.password))
    } else {
      toast.error('Por favor, corrija os erros no formulário.')
    }
  }, [errors])

  const submit = (e) => {
    e.preventDefault()
    post(route('login'), {
      onFinish: () => reset('password'),
      onSuccess: () => {
        toast.success('Login realizado com sucesso!')
      },
    })
  }

  const scrollToGoogle = () => {
    googleButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <GuestLayout bgClassName="bg-[#1e1b1e] text-gray-100">
      <Head title="Entrar" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto px-4"
      >
        <NeumorphicCard className="flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 tracking-tight">
            Entrar
          </h1>

          <div ref={googleButtonRef}>
            <GoogleButton
              onClick={triggerGoogleLogin}
              isLoading={googleLoading}
              label="Entrar com Google"
              disabled={processing}
            />
          </div>

          <p className="text-gray-400 text-sm mt-6 mb-7 font-medium opacity-80">
            ou use sua conta
          </p>

          <motion.form
            onSubmit={submit}
            className="w-full space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            noValidate
          >
            <AuthAlert
              variant="warning"
              show={isGoogleOnly}
              message="Este email está vinculado apenas ao Google."
              action={{ label: 'Usar login com Google →', onClick: scrollToGoogle }}
            />

            <AuthAlert
              variant="error"
              show={isThrottle}
              message={emailMessage}
            />

            <NeumorphicField
              id="email"
              label="E-mail"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={(isGoogleOnly || isThrottle) ? null : errors.email}
              autoComplete="username"
              autoFocus
              type="email"
            />

            <NeumorphicField
              id="password"
              label="Senha"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-gray-500 hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon type={showPassword ? 1 : 2} />
                </button>
              }
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
              <label className="flex items-center select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-transparent accent-[var(--theme-accent)] focus:ring-0"
                />
                <span className="ms-2 text-sm text-gray-400">Lembrar-me</span>
              </label>

              {canResetPassword && (
                <Link
                  href={route('password.request')}
                  className="text-sm text-gray-400 hover:text-white transition-colors self-end"
                >
                  Esqueceu a senha?
                </Link>
              )}
            </div>

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
                {processing ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </motion.form>

          <div className="mt-7 pt-4 border-t border-white/5 text-center text-sm text-gray-400 w-full">
            <span>Não tem conta? </span>
            <Link href={route('register')} className="underline text-gray-200 hover:text-white ml-1">
              Cadastre-se
            </Link>
          </div>
        </NeumorphicCard>
      </motion.div>
    </GuestLayout>
  )
}
