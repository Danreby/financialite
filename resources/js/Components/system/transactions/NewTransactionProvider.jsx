import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import ExpenseForm from '@/Components/system/ExpenseForm'
import QuickIncomeForm from '@/Components/system/income/QuickIncomeForm'

/** Evento disparado quando uma transação é criada pelo botão global. */
export const TRANSACTION_CREATED_EVENT = 'financialite:transaction-created'

const NewTransactionContext = createContext({ openNewTransaction: () => {}, openNewIncome: () => {} })

export const useNewTransaction = () => useContext(NewTransactionContext)

const EMPTY = { bankAccounts: [], categories: [], bankAccountsList: [] }

function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false
  if (target.isContentEditable) return true
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'))
}

/**
 * "Nova despesa" de qualquer tela: abre o ExpenseForm num modal, com as
 * listas (cartões, contas e categorias) buscadas na hora em
 * `transaction-form.options`. Atalho: tecla N fora de campos de texto.
 * "Nova entrada" (só pela paleta Ctrl K) abre o QuickIncomeForm do Dashboard.
 * O nome openNewTransaction ficou por compatibilidade: abre a despesa.
 */
export default function NewTransactionProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [options, setOptions] = useState(EMPTY)
  const requestRef = useRef(0)

  const loadOptions = useCallback(() => {
    const requestId = ++requestRef.current
    axios
      .get(route('transaction-form.options'))
      .then(({ data }) => {
        if (requestId !== requestRef.current) return
        setOptions({
          bankAccounts: data?.bankAccounts ?? [],
          categories: data?.categories ?? [],
          bankAccountsList: data?.bankAccountsList ?? [],
        })
      })
      .catch(() => {
        // Sem as listas o formulário ainda funciona (sem cartão e sem categoria).
      })
  }, [])

  const openNewTransaction = useCallback(() => {
    setOpen(true)
    loadOptions()
  }, [loadOptions])

  const openNewIncome = useCallback(() => {
    setIncomeOpen(true)
    loadOptions()
  }, [loadOptions])

  const created = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRANSACTION_CREATED_EVENT))
    router.reload({ preserveScroll: true, preserveState: true })
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'n' && event.key !== 'N') return
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing) return
      if (event.defaultPrevented || isTypingTarget(event.target)) return
      // Outro diálogo aberto (modal, paleta, gaveta): o atalho não age por cima.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      event.preventDefault()
      openNewTransaction()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openNewTransaction])

  const value = useMemo(() => ({ openNewTransaction, openNewIncome }), [openNewTransaction, openNewIncome])

  return (
    <NewTransactionContext.Provider value={value}>
      {children}
      <ExpenseForm
        isOpen={open}
        onClose={close}
        bankAccounts={options.bankAccounts}
        debitAccounts={options.bankAccountsList}
        categories={options.categories}
        onSuccess={() => {
          setOpen(false)
          created()
        }}
      />
      <QuickIncomeForm
        isOpen={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        bankAccountsList={options.bankAccountsList}
        onSuccess={() => {
          setIncomeOpen(false)
          toast.success('Entrada cadastrada com sucesso!')
          created()
        }}
      />
    </NewTransactionContext.Provider>
  )
}
