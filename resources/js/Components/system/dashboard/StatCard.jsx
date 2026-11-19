import FinancialIcon from '@/Components/common/icons/FinancialIcon'
import UiStatCard from '@/Components/ui/StatCard'

const VARIANT_TONES = { warning: 'warning', danger: 'negative', neutral: 'neutral' }
const NUMERIC = /^[+\-\u2212]?\s*[\d.,]+\s*%?$/

/**
 * Legado: use `@/Components/ui/StatCard`. Invólucro fino:
 * title → label, delta → change, deltaVariant → tom.
 * Sem deltaVariant (como antes): delta negativo em vermelho com seta para
 * baixo; delta "+x" ou numérico em verde com seta para cima; outro texto
 * ("3 fonte(s) ativa(s)") em verde, sem seta.
 */
export default function StatCard({ title, value, delta, icon, deltaVariant }) {
  const text = typeof delta === 'string' ? delta.trim() : delta != null ? String(delta) : ''
  const isNegative = text.startsWith('-') || text.startsWith('−')
  const isNumeric = text.startsWith('+') || NUMERIC.test(text)

  let trend = 'none'
  if (isNegative) trend = 'down'
  else if (isNumeric) trend = 'up'

  const tone = VARIANT_TONES[deltaVariant] ?? (isNegative ? 'negative' : 'positive')

  return (
    <UiStatCard
      label={title}
      value={value}
      icon={icon ? <FinancialIcon type={icon} /> : undefined}
      change={text || undefined}
      trend={trend}
      tone={tone}
    />
  )
}
