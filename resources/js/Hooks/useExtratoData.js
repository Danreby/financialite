import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { sanitizeFilterParams } from '@/Utils/security'

export function useExtratoData(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [transactions, setTransactions] = useState([])
  const [incomes, setIncomes] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const fetchData = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const sanitizedParams = sanitizeFilterParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        bank_user_id: filters.bankUserId,
        category_id: filters.categoryId,
        type: filters.type,
      })

      const response = await axios.get(route('extrato.data'), {
        params: sanitizedParams,
        timeout: 10000,
        signal: abortControllerRef.current.signal,
      })

      const data = response.data || {}

      setTransactions(data.transactions || [])
      setIncomes(data.incomes || [])
      setSummary(data.summary || null)
    } catch (err) {
      // Ignore aborted requests
      if (axios.isCancel(err) || err.name === 'AbortError' || err.name === 'CanceledError') return
      console.error('Erro ao carregar extrato:', err)
      setError(err.response?.data?.message || 'Erro ao carregar extrato.')
      toast.error('Erro ao carregar dados do extrato.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Debounce filter changes by 300ms to prevent rapid re-fetches
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData()
    }, 300)

    return () => {
      clearTimeout(timeout)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    
    setFilters({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      bankUserId: '',
      categoryId: '',
      type: '',
    })
  }, [])

  const totalTransactions = transactions.reduce(
    (sum, group) => sum + (group.transactions?.length || 0),
    0
  )

  return {
    transactions,
    incomes,
    summary,
    loading,
    error,
    filters,
    totalTransactions,
    updateFilters,
    resetFilters,
    refetch: fetchData,
  }
}
