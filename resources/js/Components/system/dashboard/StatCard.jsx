import FinancialIcon from '@/Components/common/icons/FinancialIcon'
import UiStatCard from '@/Components/ui/StatCard'

const TONES = { warning: 'warning', danger: 'negative', neutral: 'neutral' }

/**
 * Legado: use `@/Components/ui/StatCard`. Invólucro fino que mapeia
 * title → label, delta → change (texto) e deltaVariant → tom.
 */
export default function StatCard({ title, value, delta, icon, deltaVariant }) {
  const isNegative = typeof delta === 'string' && delta.trim().startsWith('-')
  const tone = TONES[deltaVariant] ?? (delta ? (isNegative ? 'negative' : 'neutral') : undefined)
  const Icon = icon ? () => <FinancialIcon type={icon} /> : undefined

  return <UiStatCard label={title} value={value} icon={Icon} change={delta} trend={isNegative ? 'down' : 'flat'} tone={tone} />
}
