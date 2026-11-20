/*
 * Regras do Dashboard como funções puras (sem React, sem rede).
 *
 * Não há framework de teste de JS no projeto; para conferir à mão:
 *   node --input-type=module -e "import('./resources/js/Lib/dashboard.js').then((m) => console.log(m.percentChange(110, 100)))"
 * Cada função recebe tudo de que precisa (inclusive `today`/`now`), então o
 * resultado só depende dos argumentos.
 */
import { formatCurrencyBRL } from './formatters.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** Variação abaixo deste valor (em %) conta como estável. */
export const TREND_THRESHOLD = 5

const num = (value) => Number(value) || 0

const PERCENT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const PERCENT_1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** 12.4 → "12%"; com `decimals` 1 → "12,4%". */
export function formatPercent(value, decimals = 0) {
  return `${(decimals ? PERCENT_1 : PERCENT).format(num(value))}%`
}

/**
 * Variação percentual de `previous` para `current`.
 * Devolve null quando não há base de comparação (anterior zero).
 * direction: up | down | flat (flat dentro de ±threshold).
 */
export function percentChange(current, previous, threshold = TREND_THRESHOLD) {
  const c = num(current)
  const p = num(previous)
  if (p === 0) return null
  const pct = ((c - p) / Math.abs(p)) * 100
  const direction = pct > threshold ? 'up' : pct < -threshold ? 'down' : 'flat'
  return { pct, abs: Math.abs(pct), direction }
}

/** Texto curto da variação: "+12%", "−8%" ou "0%". */
export function changeLabel(change) {
  if (!change) return ''
  if (change.direction === 'flat') return formatPercent(change.abs)
  return `${change.direction === 'up' ? '+' : '−'}${formatPercent(change.abs)}`
}

/* ── Série mensal (stats.monthly_summary) ─────────────────────────── */

export const creditOf = (month) => num(month?.credit_total ?? month?.invoice_total)
export const debitOf = (month) => num(month?.debit_total)
export const totalOf = (month) => creditOf(month) + debitOf(month)

/** Compara o mês `monthKey` com o mês anterior da série usando `pick`. */
export function monthOverMonth(summary = [], monthKey, pick) {
  const index = summary.findIndex((m) => m.month_key === monthKey)
  if (index <= 0) return null
  return percentChange(pick(summary[index]), pick(summary[index - 1]))
}

/* ── Datas ─────────────────────────────────────────────────────────── */

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** "2026-11-25" (data local) ou ISO completo → Date. */
export function parseDate(value) {
  if (!value) return null
  const text = String(value)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00`) : new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Dias inteiros de hoje até a data (negativo = já passou). */
export function daysUntil(value, today = new Date()) {
  const date = parseDate(value)
  if (!date) return null
  return Math.round((startOfDay(date) - startOfDay(today)) / DAY_MS)
}

/** 0 → "hoje", 1 → "amanhã", 5 → "em 5 dias", -2 → "há 2 dias". */
export function relativeDays(days) {
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days === -1) return 'ontem'
  if (days < 0) return `há ${Math.abs(days)} dias`
  return `em ${days} dias`
}

const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** "25 de nov." → "25 nov". */
export function shortDate(value) {
  const date = parseDate(value)
  return date ? SHORT_DATE.format(date).replace(/\.|de /g, '').trim() : ''
}

/* ── Indicadores (linha de KPIs) ──────────────────────────────────── */

/**
 * Próximo fechamento de fatura a partir de stats.next_card_due_date
 * ({ cards: [...], nearest }). O campo days_until_due é dias até o fechamento.
 */
export function buildDueDateKpi(nextDueInfo) {
  const nearest = nextDueInfo?.nearest ?? null
  if (!nearest) {
    return { value: '—', caption: 'Nenhum cartão com fatura aberta', tone: 'neutral', days: null }
  }

  const days = num(nearest.days_until_due)
  const value = days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days} dias`
  const others = (nextDueInfo?.cards?.length ?? 1) - 1
  const caption = others > 0 ? `${nearest.card_name} e mais ${others}` : nearest.card_name
  const tone = days === 0 ? 'negative' : days <= 3 ? 'warning' : 'neutral'

  return { value, caption, tone, days, date: nearest.next_due_date }
}

/** Indicador de gasto: subir é ruim (vermelho), cair é bom (verde). */
function spendingChange(change) {
  if (!change) return {}
  return {
    change: changeLabel(change),
    trend: change.direction,
    tone: change.direction === 'up' ? 'negative' : change.direction === 'down' ? 'positive' : 'neutral',
    caption: 'vs mês anterior',
  }
}

/**
 * Os cinco indicadores do resumo. Valores em reais saem como número (o card
 * formata com MoneyText); a variação vem da série mensal, quando existe.
 */
export function buildKpis(stats = {}) {
  const summary = Array.isArray(stats.monthly_summary) ? stats.monthly_summary : []
  const monthKey = stats.current_month_key
  const invoice = num(stats.current_month_pending_bill)
  const debit = num(stats.current_month_debit_total)
  const income = num(stats.total_monthly_income)
  const due = buildDueDateKpi(stats.next_card_due_date)
  const monthLabel = stats.current_month_label || 'Mês atual'

  const withFallback = (change, caption) => (change ? spendingChange(change) : { caption, trend: 'none' })

  return [
    { id: 'fatura', label: 'Fatura atual', value: invoice, money: true, ...withFallback(monthOverMonth(summary, monthKey, creditOf), monthLabel) },
    { id: 'debito', label: 'Transações no débito', value: debit, money: true, ...withFallback(monthOverMonth(summary, monthKey, debitOf), monthLabel) },
    { id: 'total', label: 'Total mensal', value: invoice + debit, money: true, ...withFallback(monthOverMonth(summary, monthKey, totalOf), 'Fatura + débito') },
    {
      id: 'restante',
      label: 'Dinheiro restante',
      value: num(stats.remaining_money),
      money: true,
      trend: 'none',
      caption: income > 0 ? `de ${formatCurrencyBRL(income)} de renda` : 'Sem renda cadastrada',
    },
    {
      id: 'fechamento',
      label: 'Próximo fechamento',
      value: due.value,
      money: false,
      trend: 'none',
      tone: due.tone,
      change: due.days !== null && due.days <= 3 ? (due.days === 0 ? 'Fecha hoje' : 'Fecha logo') : undefined,
      caption: due.caption,
    },
  ]
}

/* ── Previsão do mês ──────────────────────────────────────────────── */

export function buildForecast(stats = {}) {
  const parts = [
    { key: 'invoice', label: 'Fatura pendente', value: num(stats.current_month_pending_bill) },
    { key: 'bills', label: 'Contas do mês', value: num(stats.current_month_bills_total) },
    { key: 'debit', label: 'Débito do mês', value: num(stats.current_month_debit_total) },
  ]
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  return {
    total,
    monthLabel: stats.current_month_label || 'Mês atual',
    parts: parts.map((p) => ({ ...p, share: total > 0 ? (p.value / total) * 100 : 0 })),
  }
}

/* ── Maiores gastos ───────────────────────────────────────────────── */

/**
 * Ordena por total e calcula a fatia de cada categoria (0–100, soma ≈ 100).
 * `share` é o percentual real; a barra usa no mínimo `minBar` para não sumir.
 */
export function withShares(items = [], minBar = 3) {
  const list = Array.isArray(items) ? items : []
  const sorted = [...list].sort((a, b) => num(b.total) - num(a.total))
  const grand = sorted.reduce((sum, item) => sum + num(item.total), 0)
  return sorted.map((item) => {
    const share = grand > 0 ? (num(item.total) / grand) * 100 : 0
    return { ...item, total: num(item.total), share, bar: share > 0 ? Math.max(minBar, share) : 0 }
  })
}

/* ── Saúde financeira ─────────────────────────────────────────────── */

/**
 * Fatores na ordem em que aparecem. good/ok: limites de "Bom" e "Regular"
 * (abaixo de ok = "Atenção"). `max` normaliza a barra; `missing` diz qual
 * dado ausente desliga o fator.
 */
export const HEALTH_FACTORS = [
  { key: 'savingsRate', label: 'Taxa de poupança', unit: '%', good: 20, ok: 10, max: 25, missing: 'incomes' },
  { key: 'budgetAdherence', label: 'Aderência ao orçamento', unit: '%', good: 80, ok: 60, max: 100, missing: 'budget' },
  { key: 'emergencyFund', label: 'Reserva de emergência', unit: 'meses', good: 6, ok: 3, max: 6, missing: 'transactions' },
  { key: 'recurringControl', label: 'Controle de despesas fixas', unit: '%', good: 80, ok: 60, max: 100, missing: 'bills' },
  { key: 'paymentDiscipline', label: 'Contas pagas em dia', unit: '%', good: 90, ok: 70, max: 100, missing: 'bills' },
  { key: 'budgetUsage', label: 'Uso do orçamento', unit: '%', good: 30, ok: 10, max: 100, missing: 'budget' },
]

export const FACTOR_STATUS = {
  bom: { label: 'Bom', tone: 'success' },
  regular: { label: 'Regular', tone: 'warning' },
  atencao: { label: 'Atenção', tone: 'danger' },
}

export function factorStatus(definition, value) {
  if (value >= definition.good) return 'bom'
  if (value >= definition.ok) return 'regular'
  return 'atencao'
}

export function formatFactor(definition, value) {
  if (definition.unit === 'meses') {
    const v = num(value)
    return `${PERCENT_1.format(v)} ${v === 1 ? 'mês' : 'meses'}`
  }
  return formatPercent(value)
}

export function buildHealthFactors(factors = {}, missing = {}) {
  return HEALTH_FACTORS.map((def) => {
    const value = num(factors?.[def.key])
    const disabled = Boolean(missing?.[def.missing])
    const status = disabled ? null : factorStatus(def, value)
    return {
      key: def.key,
      label: def.label,
      value,
      display: disabled ? 'Sem dados' : formatFactor(def, value),
      status,
      disabled,
      ratio: Math.min(Math.max(value / def.max, 0), 1),
      definition: def,
    }
  })
}

export function scoreLabel(score) {
  const s = num(score)
  if (s >= 80) return { label: 'Excelente', tone: 'success' }
  if (s >= 60) return { label: 'Boa', tone: 'success' }
  if (s >= 40) return { label: 'Regular', tone: 'warning' }
  return { label: 'Atenção', tone: 'danger' }
}

export function healthRecommendation(score, factors = {}, missing = {}) {
  if (num(score) >= 80) return 'Sua saúde financeira está excelente. Continue assim.'
  if (!missing.transactions && num(factors.emergencyFund) < 3) return 'Monte uma reserva que cubra de 3 a 6 meses de despesas.'
  if (!missing.incomes && num(factors.savingsRate) < 10) return 'Tente guardar pelo menos 10% da renda todo mês.'
  if (!missing.budget && num(factors.budgetAdherence) < 70) return 'Algumas categorias passaram do limite. Revise o orçamento.'
  if (!missing.bills && num(factors.recurringControl) < 60) return 'As despesas fixas passam de 40% da renda. Veja o que dá para cortar.'
  return 'Continue registrando suas finanças para uma análise mais precisa.'
}

export const MISSING_DATA_LABELS = {
  incomes: 'Cadastre suas rendas',
  transactions: 'Registre transações',
  bills: 'Adicione contas a pagar',
  budget: 'Configure um orçamento',
}

/* ── Tendências ───────────────────────────────────────────────────── */

export function buildTrends(trends = {}) {
  const current = num(trends.current_month)
  const previous = num(trends.previous_month)
  const average = num(trends.three_month_avg)
  return {
    hasData: Boolean(trends.has_data),
    current,
    previous,
    average,
    vsPrevious: percentChange(current, previous),
    vsAverage: percentChange(current, average),
    // Da maior para a menor no mês atual.
    categories: (trends.category_trends ?? [])
      .map((t) => ({
        name: t.categoryName || 'Sem categoria',
        current: num(t.current),
        previous: num(t.previous),
        change: percentChange(t.current, t.previous),
      }))
      .sort((a, b) => b.current - a.current),
  }
}

/* ── Alertas do mês ───────────────────────────────────────────────── */

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 }

/**
 * Alertas derivados só dos dados do painel (nada inventado):
 * - Orçamento: categoria (ou total) acima do limite → Alta.
 * - Conta não paga vencida ou vencendo em até 2 dias → Alta; 3 a 7 dias → Média.
 * - Fatura de cartão fechando em até 5 dias → Média.
 * - Fator da saúde financeira em "Atenção" → Média (menos da metade do mínimo) ou Baixa.
 * Ordem: prioridade, depois o prazo mais curto.
 * Cada alerta: { id, kind, title, priority, description, detail, icon, sortDays, bill? }.
 */
export function deriveAlerts({ budgetProgress = {}, bills = [], nextDueInfo = null, health = null, today = new Date() } = {}) {
  const alerts = []

  for (const budget of budgetProgress.budgets ?? []) {
    const limit = num(budget.limit)
    const spent = num(budget.spent)
    if (limit > 0 && spent > limit) {
      alerts.push({
        id: `budget-${budget.categoryName}`,
        kind: 'budget',
        title: `${budget.categoryName || 'Sem categoria'} acima do orçamento`,
        priority: 'alta',
        description: `${formatCurrencyBRL(spent)} gastos de um limite de ${formatCurrencyBRL(limit)}.`,
        detail: `${formatCurrencyBRL(spent - limit)} acima do planejado (${formatPercent(((spent - limit) / limit) * 100)})`,
        icon: 'budget',
        sortDays: 0,
      })
    }
  }

  const totalBudget = num(budgetProgress.total_budget)
  const totalSpent = num(budgetProgress.total_spent)
  if (totalBudget > 0 && totalSpent > totalBudget) {
    alerts.push({
      id: 'budget-total',
      kind: 'budget',
      title: 'Orçamento do mês estourado',
      priority: 'alta',
      description: `${formatCurrencyBRL(totalSpent)} gastos de ${formatCurrencyBRL(totalBudget)} planejados.`,
      detail: `${formatCurrencyBRL(totalSpent - totalBudget)} acima do planejado`,
      icon: 'budget',
      sortDays: 0,
    })
  }

  for (const bill of bills ?? []) {
    if (bill.status === 'paid') continue
    const date = bill.date || bill.due_date
    const days = daysUntil(date, today)
    if (days === null || days > 7) continue
    const overdue = bill.is_overdue || bill.status === 'overdue' || days < 0
    const name = bill.title || bill.description || 'Conta sem nome'
    alerts.push({
      id: `bill-${bill.id}-${date}`,
      kind: 'bill',
      title: overdue ? `${name} venceu ${relativeDays(days)}` : `${name} vence ${relativeDays(days)}`,
      priority: overdue || days <= 2 ? 'alta' : 'media',
      description: num(bill.amount) > 0 ? `Valor de ${formatCurrencyBRL(bill.amount)}.` : 'Valor a definir.',
      detail: `Vencimento em ${shortDate(date)}${bill.category_name ? ` · ${bill.category_name}` : ''}`,
      icon: 'bill',
      sortDays: days,
      bill,
    })
  }

  for (const card of nextDueInfo?.cards ?? []) {
    const days = num(card.days_until_due)
    if (days > 5) continue
    alerts.push({
      id: `closing-${card.card_id}`,
      kind: 'closing',
      title: `Fatura do ${card.card_name} fecha ${relativeDays(days)}`,
      priority: 'media',
      description: 'Compras feitas depois do fechamento entram na fatura seguinte.',
      detail: `Fechamento em ${shortDate(card.next_due_date)}`,
      icon: 'card',
      sortDays: days,
    })
  }

  if (health?.has_data) {
    for (const factor of buildHealthFactors(health.factors, health.missing_data)) {
      if (factor.status !== 'atencao') continue
      const def = factor.definition
      alerts.push({
        id: `health-${factor.key}`,
        kind: 'health',
        title: `${factor.label} em atenção`,
        priority: factor.value < def.ok / 2 ? 'media' : 'baixa',
        description: `Está em ${factor.display}; o mínimo recomendado é ${formatFactor(def, def.ok)}.`,
        detail: 'Fator da saúde financeira',
        icon: 'health',
        sortDays: 99,
      })
    }
  }

  return alerts.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.sortDays - b.sortDays)
}

/* ── Atividade recente ────────────────────────────────────────────── */

export const ACTIVITY_PERIODS = [
  { value: '7d', label: '7 dias', days: 7 },
  { value: '30d', label: '30 dias', days: 30 },
  { value: 'all', label: 'Tudo', days: null },
]

/** Filtra pelo período (por created_at) as transações já carregadas. */
export function filterByPeriod(items = [], period = 'all', now = new Date()) {
  const days = ACTIVITY_PERIODS.find((p) => p.value === period)?.days
  if (!days) return items
  const from = startOfDay(now).getTime() - (days - 1) * DAY_MS
  return items.filter((item) => {
    const date = parseDate(item.created_at)
    return date && startOfDay(date).getTime() >= from
  })
}

/** Linha da tabela a partir de uma transação do endpoint (Transacao). */
export function toActivityRow(tx) {
  const isDebit = tx.type === 'debit'
  const installments = num(tx.total_installments)
  return {
    id: tx.id,
    date: shortDate(tx.created_at),
    isoDate: tx.created_at,
    description: tx.title || tx.description || 'Sem descrição',
    installments: installments > 1 ? `${installments}x` : null,
    recurring: Boolean(tx.is_recurring),
    category: tx.category ? { name: tx.category.name, color: tx.category.color } : null,
    account: isDebit ? 'Conta bancária' : tx.bank_user?.card?.name || 'Cartão de crédito',
    method: isDebit ? 'Débito' : 'Crédito',
    amount: num(tx.amount),
  }
}

/** Dados do modal de detalhe (FaturaDetailModal) a partir da transação. */
export function toDetailItem(tx) {
  return {
    id: tx.id,
    bank_user_id: tx.bank_user_id,
    category_id: tx.category_id,
    title: tx.title,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    created_at: tx.created_at,
    paid_date: tx.paid_date,
    total_installments: tx.total_installments,
    current_installment: tx.current_installment,
    display_installment: null,
    is_recurring: tx.is_recurring,
    bank_name: tx.bank_user?.card?.name,
    category_name: tx.category?.name,
    category_icon: tx.category?.icon,
    category_color: tx.category?.color,
  }
}
