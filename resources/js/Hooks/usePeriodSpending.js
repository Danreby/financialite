import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

/**
 * Custom hook to fetch top spending categories for a selected month period.
 * Implements request deduplication via AbortController and clean state management.
 *
 * @returns {Object} Period spending state and actions.
 */
export default function usePeriodSpending() {
  const [periodData, setPeriodData] = useState(null)
  const [periodLabel, setPeriodLabel] = useState('')
  const [periodRecurring, setPeriodRecurring] = useState({ total: 0, percentage: 0 })
  const [periodNonRecurring, setPeriodNonRecurring] = useState({ total: 0, percentage: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const fetchPeriodSpending = useCallback(async ({ monthFrom, monthTo, bankUserId, categoryId }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const params = {
        month_from: monthFrom,
        month_to: monthTo,
      }

      if (bankUserId) params.bank_user_id = bankUserId
      if (categoryId) params.category_id = categoryId

      const response = await axios.get(route('transacoes.top_spending_by_period'), {
        params,
        signal: controller.signal,
      })

      const payload = response.data || {}

      const topSpending = Array.isArray(payload.top_spending_categories)
        ? payload.top_spending_categories
        : []

      const totalTopSpending = topSpending.reduce(
        (acc, item) => acc + Number(item.total || 0),
        0,
      )

      const normalizedSpending = totalTopSpending > 0
        ? topSpending.map((item) => ({
            ...item,
            share: Math.max(5, Math.round((Number(item.total || 0) / totalTopSpending) * 100)),
          }))
        : topSpending

      setPeriodData(normalizedSpending)
      setPeriodLabel(payload.period_label || '')
      setPeriodRecurring({
        total: Number(payload.recurring_spending?.total || 0),
        percentage: Number(payload.recurring_spending?.percentage || 0),
      })
      setPeriodNonRecurring({
        total: Number(payload.non_recurring_spending?.total || 0),
        percentage: Number(payload.non_recurring_spending?.percentage || 0),
      })
    } catch (err) {
      if (axios.isCancel(err)) return

      console.error('Error fetching period spending:', err)
      setError(err.response?.data?.error || 'Erro ao carregar dados do período.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearPeriod = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setPeriodData(null)
    setPeriodLabel('')
    setPeriodRecurring({ total: 0, percentage: 0 })
    setPeriodNonRecurring({ total: 0, percentage: 0 })
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    periodData,
    periodLabel,
    periodRecurring,
    periodNonRecurring,
    isLoading,
    error,
    fetchPeriodSpending,
    clearPeriod,
  }
}
