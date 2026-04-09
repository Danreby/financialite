import React, { useState, useMemo } from 'react'
import { Head } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer'
import CategoryBadge from '@/Components/common/CategoryBadge'
import ScrollArea from '@/Components/common/ScrollArea'
import EmptyState from '@/Components/common/EmptyState'
import { formatCurrencyBRL } from '@/Lib/formatters'

const STATUS_LABELS = {
  paid: 'Quitado',
  unpaid: 'Em aberto',
  overdue: 'Vencido',
}

const STATUS_CLASSES = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  unpaid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function parseYearMonth(ym) {
  if (!ym) return null
  try {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m - 1, 1)
  } catch { return null }
}

function formatMonth(ym) {
  const d = parseYearMonth(ym)
  if (!d) return ym
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

export default function Parcelamentos({ installments = [], bankAccounts = [], categories = [] }) {
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterCard, setFilterCard] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('remaining_desc')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let list = [...installments]

    if (filterStatus === 'active') list = list.filter((tx) => tx.status !== 'paid')
    else if (filterStatus === 'paid') list = list.filter((tx) => tx.status === 'paid')
    else if (filterStatus === 'overdue') list = list.filter((tx) => tx.status === 'overdue')

    if (filterCard) list = list.filter((tx) => String(tx.bank_user_id) === filterCard)
    if (filterCategory) list = list.filter((tx) => String(tx.category_id) === filterCategory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((tx) => tx.title?.toLowerCase().includes(q) || tx.description?.toLowerCase().includes(q))
    }

    list.sort((a, b) => {
      if (sortBy === 'remaining_desc') return (b.remaining_installments ?? 0) - (a.remaining_installments ?? 0)
      if (sortBy === 'amount_desc') return (b.amount ?? 0) - (a.amount ?? 0)
      if (sortBy === 'completion_asc') return (a.completion_month ?? '').localeCompare(b.completion_month ?? '')
      if (sortBy === 'title_asc') return (a.title ?? '').localeCompare(b.title ?? '')
      return 0
    })

    return list
  }, [installments, filterStatus, filterCard, filterCategory, searchQuery, sortBy])

  const stats = useMemo(() => {
    const active = installments.filter((tx) => tx.status !== 'paid')
    const paid = installments.filter((tx) => tx.status === 'paid')
    const overdue = installments.filter((tx) => tx.status === 'overdue')
    const totalRemainingAmount = active.reduce(
      (sum, tx) => sum + (tx.installment_amount ?? 0) * (tx.remaining_installments ?? 0),
      0,
    )
    const totalPaidAmount = installments.reduce(
      (sum, tx) => sum + (tx.installment_amount ?? 0) * (tx.current_installment ?? 0),
      0,
    )
    const totalAmount = installments.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)
    return { active: active.length, paid: paid.length, overdue: overdue.length, totalRemainingAmount, totalPaidAmount, totalAmount }
  }, [installments])

  return (
    <AuthenticatedLayout>
      <Head title="Parcelamentos" />

      <FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
        <FadeInItem type="fast">
          <header className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Parcelamentos</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Acompanhe todas as suas compras parceladas: quantas parcelas restam, quando termina cada pagamento e muito mais.
            </p>
          </header>
        </FadeInItem>

        <FadeInItem type="subtle">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Em aberto" value={stats.active} highlight icon="🔄" />
            <StatCard label="Vencidos" value={stats.overdue} highlight icon="⚠️" danger={stats.overdue > 0} />
            <StatCard label="Quitados" value={stats.paid} icon="✅" />
            <StatCard label="Total restante" value={formatCurrencyBRL(stats.totalRemainingAmount)} icon="💰" />
            <StatCard label="Total pago" value={formatCurrencyBRL(stats.totalPaidAmount)} icon="✔️" />
          </div>
        </FadeInItem>

        <FadeInItem type="subtle">
          <div className="rounded-2xl p-3 sm:p-4 shadow-md themed-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {[
                  { value: 'active', label: 'Em aberto' },
                  { value: 'overdue', label: 'Vencidos' },
                  { value: 'paid', label: 'Quitados' },
                  { value: 'all', label: 'Todos' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterStatus(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterStatus === opt.value
                        ? 'bg-theme-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 flex-1">
                <div className="relative flex-1 min-w-[160px]">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500"
                    maxLength={255}
                  />
                  <svg className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>

                {bankAccounts.length > 0 && (
                  <select
                    value={filterCard}
                    onChange={(e) => setFilterCard(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-900 focus:border-theme-accent focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
                  >
                    <option value="">Todos os cartões</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={String(acc.id)}>{acc.name}</option>
                    ))}
                  </select>
                )}

                {categories.length > 0 && (
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-900 focus:border-theme-accent focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-900 focus:border-theme-accent focus:outline-none dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
                >
                  <option value="remaining_desc">Mais parcelas restantes</option>
                  <option value="amount_desc">Maior valor</option>
                  <option value="completion_asc">Próximas a terminar</option>
                  <option value="title_asc">Nome A-Z</option>
                </select>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              {filtered.length} parcelamento(s) encontrado(s)
            </p>
          </div>
        </FadeInItem>

        <FadeInItem type="subtle">
          {filtered.length > 0 ? (
            <div className="rounded-2xl shadow-md themed-card overflow-hidden">
              <ScrollArea maxHeightClassName="max-h-[400px] sm:max-h-[530px]">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filtered.map((tx) => (
                      <InstallmentRow key={tx.id} tx={tx} />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <EmptyState
              icon="🔄"
              title="Nenhum parcelamento encontrado"
              description="Você não possui compras parceladas com os filtros selecionados."
            />
          )}
        </FadeInItem>
      </FadeInContainer>
    </AuthenticatedLayout>
  )
}

function InstallmentRow({ tx }) {
  const [expanded, setExpanded] = useState(false)

  const progress = tx.total_installments > 0
    ? Math.round((tx.current_installment / tx.total_installments) * 100)
    : 0

  const remaining = tx.remaining_installments ?? (tx.total_installments - tx.current_installment)
  const remainingAmount = (tx.installment_amount ?? 0) * remaining
  const completionLabel = tx.completion_month ? formatMonth(tx.completion_month) : '—'
  const startLabel = tx.first_billing_month ? formatMonth(tx.first_billing_month) : '—'

  const isLate = tx.status === 'overdue'
  const isDone = tx.status === 'paid'

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`p-3 sm:p-4 transition-colors ${isLate ? 'bg-red-50/50 dark:bg-red-900/10' : isDone ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
          isDone ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
          : isLate ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          : 'bg-theme-accent/10 dark:bg-theme-accent/20 text-theme-accent'
        }`}>
          {isDone ? '✅' : isLate ? '⚠️' : '🔄'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{tx.title}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASSES[tx.status] ?? STATUS_CLASSES.unpaid}`}>
              {STATUS_LABELS[tx.status] ?? tx.status}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {tx.current_installment}/{tx.total_installments}x
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            {tx.bank_name && <span>💳 {tx.bank_name}</span>}
            {tx.category_name && (
              <CategoryBadge
                name={tx.category_name}
                icon={tx.category_icon}
                color={tx.category_color}
                size="sm"
              />
            )}
            <span>🗓 {formatShortDate(tx.created_at)}</span>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
              <span>{tx.current_installment} paga(s)</span>
              <span>{remaining} restante(s)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isDone ? 'bg-emerald-500' : isLate ? 'bg-red-500' : 'bg-theme-accent'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InfoChip label="Parcela" value={formatCurrencyBRL(tx.installment_amount ?? 0)} />
            <InfoChip label="Total" value={formatCurrencyBRL(tx.amount ?? 0)} />
            <InfoChip label={isDone ? 'Concluída' : 'Término previsto'} value={completionLabel} />
            <InfoChip label="Restante a pagar" value={isDone ? '—' : formatCurrencyBRL(remainingAmount)} accent={!isDone} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex-shrink-0 ml-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={expanded ? 'Recolher' : 'Expandir'}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pl-12 space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {tx.description && (
                <p><span className="font-medium text-gray-700 dark:text-gray-300">Descrição:</span> {tx.description}</p>
              )}
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Primeira cobrança:</span> {startLabel}</p>
              <p><span className="font-medium text-gray-700 dark:text-gray-300">Última parcela:</span> {completionLabel}</p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Progresso:</span>{' '}
                {tx.current_installment} de {tx.total_installments} parcelas pagas ({progress}%)
              </p>
              {!isDone && (
                <p>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Faltam:</span>{' '}
                  {remaining} parcela(s) totalizando {formatCurrencyBRL(remainingAmount)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function InfoChip({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-2.5 py-1.5">
      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
      <p className={`text-xs font-semibold truncate ${accent ? 'text-theme-accent' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </p>
    </div>
  )
}

function StatCard({ label, value, icon, highlight, danger }) {
  return (
    <div className={`rounded-2xl p-3 sm:p-4 shadow-md themed-card flex items-center gap-3 ${danger ? 'border border-red-200 dark:border-red-800' : ''}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-theme-accent/10 dark:bg-theme-accent/20'}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className={`text-base sm:text-lg font-bold truncate ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
