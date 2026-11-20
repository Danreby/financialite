import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { dashboardService } from '@/Services/dashboardService'
import { TRANSACTION_CREATED_EVENT } from '@/Components/system/transactions/NewTransactionProvider'

/**
 * Dados do Dashboard: busca `dashboard.data` (transações recentes, stats e
 * insights) com o filtro de cartão, recarrega quando uma transação é criada
 * em qualquer lugar (TRANSACTION_CREATED_EVENT) e quando `reload()` é chamado.
 *
 * Também guarda o mês escolhido para "Maiores gastos" (clique no gráfico ou
 * seletor), buscado à parte em `transacoes.top_spending_by_period`.
 */
export default function useDashboardData() {
  const [cardId, setCardId] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ loading: true, transactions: [], stats: null, insights: null })
  const lastReloadRef = useRef(reloadKey)

  const [selectedMonth, setSelectedMonth] = useState(null)
  const [monthData, setMonthData] = useState(null)
  const [monthLoading, setMonthLoading] = useState(false)

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    window.addEventListener(TRANSACTION_CREATED_EVENT, reload)
    return () => window.removeEventListener(TRANSACTION_CREATED_EVENT, reload)
  }, [reload])

  useEffect(() => {
    let cancelled = false
    if (reloadKey !== lastReloadRef.current) {
      lastReloadRef.current = reloadKey
      dashboardService.invalidateCache()
    }

    const filters = cardId ? { bank_user_id: cardId } : {}
    dashboardService
      .getData(filters)
      .then((response) => {
        if (cancelled) return
        setState({
          loading: false,
          transactions: response.transactions?.data ?? [],
          stats: response.stats ?? {},
          insights: response.insights ?? {},
        })
      })
      .catch((error) => {
        if (cancelled) return
        console.error(error)
        setState((prev) => ({ ...prev, loading: false }))
        toast.error(error.response?.data?.message || 'Não foi possível carregar os dados do dashboard.')
      })

    return () => {
      cancelled = true
    }
  }, [cardId, reloadKey])

  // Mês de "Maiores gastos": null = mês vigente (vem junto com os stats).
  useEffect(() => {
    if (!selectedMonth) {
      setMonthData(null)
      return undefined
    }

    let cancelled = false
    setMonthLoading(true)
    const params = { month_from: selectedMonth, month_to: selectedMonth }
    if (cardId) params.bank_user_id = cardId

    axios
      .get(route('transacoes.top_spending_by_period'), { params })
      .then(({ data }) => {
        if (!cancelled) setMonthData(data || {})
      })
      .catch((error) => {
        if (cancelled) return
        console.error(error)
        toast.error('Erro ao carregar os gastos do mês.')
        setSelectedMonth(null)
      })
      .finally(() => {
        if (!cancelled) setMonthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedMonth, cardId, reloadKey])

  const changeCard = useCallback((value) => {
    setCardId(value || '')
    setSelectedMonth(null)
  }, [])

  /** Clique num mês do gráfico: escolhe; clicar de novo no mesmo volta ao vigente. */
  const toggleMonth = useCallback((monthKey) => {
    setSelectedMonth((current) => (current === monthKey ? null : monthKey))
  }, [])

  return {
    ...state,
    cardId,
    changeCard,
    reload,
    selectedMonth,
    selectMonth: setSelectedMonth,
    toggleMonth,
    monthData,
    monthLoading,
  }
}
