import React, { useRef, useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import GuestLayout from '@/Layouts/GuestLayout'
import AuthCard from '@/Components/auth/AuthCard'
import AuthAlert from '@/Components/auth/AuthAlert'
import FormField from '@/Components/auth/FormField'
import GoogleButton from '@/Components/auth/GoogleButton'
import PrimaryButton from '@/Components/common/buttons/PrimaryButton'
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
    <GuestLayout>
      <Head title="Entrar" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md mx-auto px-4"
      >
        <AuthCard>
          <motion.form
            onSubmit={submit}
            className="space-y-5 px-4 pt-6"
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

            <FormField
              id="email"
              label="E-mail"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={(isGoogleOnly || isThrottle) ? null : errors.email}
              autoComplete="username"
              autoFocus
              type="email"
            />

            <FormField
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
                  className="text-gray-400 hover:text-gray-200 focus:outline-none mt-3"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon type={showPassword ? 1 : 2} />
                </button>
              }
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center select-none cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-transparent focus:ring-0 dark:border-gray-500"
                />
                <span className="ms-2 text-sm text-gray-300">Lembrar-me</span>
              </label>

              {canResetPassword && (
                <Link
                  href={route('password.request')}
                  className="text-sm underline text-gray-300 hover:text-white self-end"
                >
                  Esqueceu a senha?
                </Link>
              )}
            </div>

            <PrimaryButton type="submit" disabled={processing} className="w-full">
              Entrar
            </PrimaryButton>
          </motion.form>

          <div className="flex items-center gap-3 my-5 px-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <div className="px-4" ref={googleButtonRef}>
            <GoogleButton
              onClick={triggerGoogleLogin}
              isLoading={googleLoading}
              label="Entrar com Google"
              disabled={processing}
            />
          </div>

          <div className="mt-6 border-t border-gray-800 pt-4 text-center text-sm text-gray-400 pb-4">
            <span>Não tem conta? </span>
            <Link href={route('register')} className="underline text-gray-200 ml-1">
              Cadastre-se
            </Link>
          </div>
        </AuthCard>
      </motion.div>
    </GuestLayout>
  )
}
