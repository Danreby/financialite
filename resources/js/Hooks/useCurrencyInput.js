import { useState, useCallback } from 'react'

const MAX_VALUE = 999999999

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
    const cleaned = str.replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return Number.isNaN(n) ? 0 : Math.min(n, MAX_VALUE)
  }

  const handleChange = useCallback((e) => {
    let raw = e.target.value

    raw = raw.replace(/[^0-9.,]/g, '')

    const commas = (raw.match(/,/g) || []).length
    const dots = (raw.match(/\./g) || []).length

    if (commas > 1) return
    if (dots > 1 && commas === 0) return

    let numStr = raw.replace(/\./g, '').replace(',', '.')

    const num = parseFloat(numStr)

    if (!Number.isNaN(num) && num > MAX_VALUE) return

    const endsWithSeparator = raw.endsWith(',') || raw.endsWith('.')
    const hasPartialDecimal = /[,.](\d?)$/.test(raw)

    if (endsWithSeparator || hasPartialDecimal) {
      if (commas > 0) {
        setDisplayValue(raw.replace(/\./g, ''))
      } else {
        setDisplayValue(raw.replace('.', ','))
      }
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
