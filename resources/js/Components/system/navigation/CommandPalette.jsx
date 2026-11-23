import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { router } from '@inertiajs/react'
import { ArrowDownLeft, CornerDownLeft, Plus, Search } from 'lucide-react'
import { Kbd } from '@/Components/ui'
import cx from '@/Components/ui/cx'
import { useFocusTrap } from '@/Hooks/useFocusTrap'
import { allDestinations } from '@/Components/system/navigation/navConfig'

const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/**
 * Paleta de comandos (Ctrl/⌘ K): lista os destinos do menu e as ações
 * "Nova despesa" e "Nova entrada". Filtra enquanto digita, setas movem, Enter abre,
 * Esc fecha. Padrão ARIA combobox + listbox, foco preso no diálogo.
 */
export default function CommandPalette({ open, onClose, initialQuery = '', onNewExpense, onNewIncome }) {
  const [query, setQuery] = useState(initialQuery)
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)
  const baseId = useId()
  const listId = `${baseId}-list`
  const { containerRef } = useFocusTrap(open, { onEscape: onClose })

  useEffect(() => {
    if (open) {
      setQuery(initialQuery)
      setActiveIndex(0)
    }
  }, [open, initialQuery])

  useEffect(() => {
    if (!open) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const entries = useMemo(() => {
    if (!open) return []
    const destinations = allDestinations().map((item) => ({
      key: item.route,
      label: item.label,
      group: item.group,
      icon: item.icon,
      haystack: normalize(`${item.label} ${item.group} ${item.keywords ?? ''}`),
      run: () => router.visit(route(item.route)),
    }))
    const actions = []
    if (onNewExpense) {
      actions.push({
        key: 'nova-despesa',
        label: 'Nova despesa',
        group: 'Ação',
        icon: Plus,
        haystack: normalize('nova despesa gasto compra débito crédito registrar adicionar transação'),
        run: onNewExpense,
      })
    }
    if (onNewIncome) {
      actions.push({
        key: 'nova-entrada',
        label: 'Nova entrada',
        group: 'Ação',
        icon: ArrowDownLeft,
        haystack: normalize('nova entrada receita salário pix recebimento registrar adicionar'),
        run: onNewIncome,
      })
    }
    return [...actions, ...destinations]
  }, [open, onNewExpense, onNewIncome])

  const results = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return entries
    return entries.filter((entry) => terms.every((term) => entry.haystack.includes(term)))
  }, [entries, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const choose = useCallback(
    (entry) => {
      if (!entry) return
      onClose()
      // Deixa o diálogo fechar (e devolver o foco) antes de navegar ou abrir outro modal.
      window.setTimeout(entry.run, 0)
    },
    [onClose],
  )

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Home' && event.ctrlKey) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && event.ctrlKey) {
      event.preventDefault()
      setActiveIndex(Math.max(results.length - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[activeIndex])
    }
  }

  if (!open || typeof document === 'undefined') return null

  const activeId = results[activeIndex] ? `${baseId}-opt-${results[activeIndex].key}` : undefined

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onMouseDown={onClose} />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ir para"
        tabIndex={-1}
        className="surface-card relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden shadow-pop"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Buscar página ou ação"
            placeholder="Buscar página ou ação…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            className="h-12 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-0"
          />
          <Kbd>Esc</Kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="scrollbar-custom flex-1 overflow-y-auto p-2">
          {results.map((entry, index) => {
            const Icon = entry.icon
            const selected = index === activeIndex
            return (
              <li
                key={entry.key}
                id={`${baseId}-opt-${entry.key}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => choose(entry)}
                className={cx(
                  'flex cursor-pointer items-center gap-3 rounded-chip px-3 py-2.5 text-sm',
                  selected ? 'bg-surface-sunken text-content-primary' : 'text-content-secondary',
                )}
              >
                {Icon && (
                  <Icon
                    className={cx('h-4 w-4 shrink-0', selected ? 'text-theme-accent' : 'text-content-muted')}
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                <span className="shrink-0 text-xs text-content-muted">{entry.group}</span>
                {selected && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>

        {results.length === 0 && (
          <p className="px-4 pb-6 pt-2 text-center text-sm text-content-muted" aria-hidden="true">
            Nenhuma página com “{query}”. Tente “fatura”, “bancos” ou “relatórios”.
          </p>
        )}

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {results.length === 0
            ? `Nenhum resultado para ${query}`
            : `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}
        </p>

        <div className="hidden items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-content-muted sm:flex">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> mover
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd> abrir
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd> fechar
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
