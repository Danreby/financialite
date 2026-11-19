import StatCard from '@/Components/ui/StatCard';

/**
 * Legado: use `@/Components/ui/StatCard`. Mantido como invólucro fino.
 * `icon` pode ser componente ou elemento; texto/emoji é ignorado (o kit não
 * usa emoji como ícone). `colorClass` foi descartado (o chip é neutro).
 */
export default function StatsCard({ icon, label, value, subText }) {
	return <StatCard icon={typeof icon === 'string' ? undefined : icon} label={label} value={value} caption={subText} />;
}
