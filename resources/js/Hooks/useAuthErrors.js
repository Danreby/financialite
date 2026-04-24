export const AUTH_ERROR_TYPES = {
  GOOGLE_ONLY: 'google_only',
  DUPLICATE_GOOGLE: 'duplicate_google',
  DUPLICATE_EMAIL: 'duplicate_email',
  CREDENTIALS: 'credentials',
  THROTTLE: 'throttle',
  UNVERIFIED: 'unverified',
  GENERIC: 'generic',
}

export function detectErrorType(errorMsg) {
  if (!errorMsg) return null
  const msg = errorMsg.toLowerCase()

  if (errorMsg === 'google_only_account' || msg.includes('vinculado apenas ao google')) {
    return AUTH_ERROR_TYPES.GOOGLE_ONLY
  }
  if (msg.includes('vinculado a uma conta google') || (msg.includes('google') && msg.includes('entrar com google'))) {
    return AUTH_ERROR_TYPES.DUPLICATE_GOOGLE
  }
  if (msg.includes('já está cadastrado') || msg.includes('faça login') || msg.includes('redefina sua senha')) {
    return AUTH_ERROR_TYPES.DUPLICATE_EMAIL
  }
  if (msg.includes('incorretos') || errorMsg === 'auth.failed' || msg.includes('these credentials')) {
    return AUTH_ERROR_TYPES.CREDENTIALS
  }
  if (msg.includes('throttle') || msg.includes('tentativas') || msg.includes('segundos') || msg.includes('minutos')) {
    return AUTH_ERROR_TYPES.THROTTLE
  }
  if (msg.includes('verificado') || msg.includes('confirme') || msg.includes('verifique seu e-mail')) {
    return AUTH_ERROR_TYPES.UNVERIFIED
  }

  return AUTH_ERROR_TYPES.GENERIC
}

export function humanizeError(errorMsg) {
  if (!errorMsg) return null

  const type = detectErrorType(errorMsg)

  const messages = {
    [AUTH_ERROR_TYPES.GOOGLE_ONLY]:
      'Este email está vinculado apenas ao Google. Use o botão "Entrar com Google".',
    [AUTH_ERROR_TYPES.DUPLICATE_GOOGLE]:
      'Este email está vinculado a uma conta Google. Entre usando o botão "Entrar com Google".',
    [AUTH_ERROR_TYPES.DUPLICATE_EMAIL]:
      'Este email já está cadastrado. Faça login ou redefina sua senha.',
    [AUTH_ERROR_TYPES.CREDENTIALS]:
      'Email ou senha incorretos.',
    [AUTH_ERROR_TYPES.THROTTLE]:
      'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
    [AUTH_ERROR_TYPES.UNVERIFIED]:
      'Verifique seu e-mail antes de fazer login.',
  }

  if (messages[type]) return messages[type]

  return errorMsg
}

export default function useAuthErrors(errors = {}) {
  const emailErrorType = errors.email ? detectErrorType(errors.email) : null
  const passwordErrorType = errors.password ? detectErrorType(errors.password) : null

  const emailMessage = errors.email ? humanizeError(errors.email) : null
  const passwordMessage = errors.password ? humanizeError(errors.password) : null

  return {
    isGoogleOnly: emailErrorType === AUTH_ERROR_TYPES.GOOGLE_ONLY,
    isDuplicateGoogle: emailErrorType === AUTH_ERROR_TYPES.DUPLICATE_GOOGLE,
    isDuplicateEmail: emailErrorType === AUTH_ERROR_TYPES.DUPLICATE_EMAIL,
    isCredentials: emailErrorType === AUTH_ERROR_TYPES.CREDENTIALS,
    isThrottle: emailErrorType === AUTH_ERROR_TYPES.THROTTLE,
    isUnverified: emailErrorType === AUTH_ERROR_TYPES.UNVERIFIED,

    emailMessage,
    passwordMessage,
    emailErrorType,
    passwordErrorType,

    humanizeError,
    detectErrorType,
    AUTH_ERROR_TYPES,
  }
}
