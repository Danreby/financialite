import { useState, useCallback } from 'react'

const MAX_VALUE = 999999999

/**
 * Hook para entrada de valores monetários em pt-BR.
 * Formata enquanto o usuário digita (ex: "1.234,56") e expõe o valor numérico parseado.
 *
 * @param {number|string} initialValue - Valor numérico inicial (ex: 1234.56)
 * @returns {{ displayValue, numericValue, handleChange, reset, setFromNumeric }}
 */
export function useCurrencyInput(initialValue = '') {
  const toDisplay = (raw) => {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'))
    if (!raw && raw !== 0) return ''
    if (Number.isNaN(n)) return ''
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.min(n, MAX_VALUE))
  }

  const [displayValue, setDisplayValue] = useState(() => toDisplay(initialValue))

  const parseDisplay = (str) => {
    if (!str) return 0
    // Remove separadores de milhar (.) e troca vírgula decimal por ponto
    const cleaned = str.replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return Number.isNaN(n) ? 0 : Math.min(n, MAX_VALUE)
  }

  const handleChange = useCallback((e) => {
    let raw = e.target.value

    // Permite apenas dígitos, ponto e vírgula
    raw = raw.replace(/[^0-9.,]/g, '')

    // Evita múltiplos separadores decimais
    const commas = (raw.match(/,/g) || []).length
    const dots = (raw.match(/\./g) || []).length

    if (commas + dots > 1) return

    // Normaliza: trata ponto como separador decimal temporário se não houver vírgula
    let numStr = raw.replace(/\./g, '').replace(',', '.')

    const num = parseFloat(numStr)

    // Verifica limite máximo
    if (!Number.isNaN(num) && num > MAX_VALUE) return

    // Se o usuário ainda está digitando os centavos (termina em vírgula/ponto ou tem zeros no fim),
    // mantemos o display raw para não interromper a digitação
    const endsWithSeparator = raw.endsWith(',') || raw.endsWith('.')
    const hasPartialDecimal = /[,.](\d?)$/.test(raw)

    if (endsWithSeparator || hasPartialDecimal) {
      // Normaliza o separador para vírgula no display
      setDisplayValue(raw.replace('.', ','))
      return
    }

    if (!raw) {
      setDisplayValue('')
      return
    }

    if (Number.isNaN(num)) {
      setDisplayValue(raw)
      return
    }

    // Conta quantas casas decimais foram digitadas
    const decimalMatch = numStr.match(/\.(\d+)$/)
    const decimalDigits = decimalMatch ? decimalMatch[1].length : 0
    const minFrac = Math.min(decimalDigits, 2)

    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: 2,
    }).format(num)

    setDisplayValue(formatted)
  }, [])

  const numericValue = parseDisplay(displayValue)

  const reset = useCallback(() => {
    setDisplayValue('')
  }, [])

  const setFromNumeric = useCallback((value) => {
    setDisplayValue(toDisplay(value))
  }, [])

  return {
    displayValue,
    numericValue,
    handleChange,
    reset,
    setFromNumeric,
  }
}
