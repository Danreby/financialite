import StatCard from '@/Components/ui/StatCard';

/**
 * Legado: use `@/Components/ui/StatCard`. Mantido como invólucro fino.
 * `icon` antigo era emoji/texto; só um componente vira chip de ícone.
 * `colorClass` foi descartado (o chip é neutro na direção nova).
 */
export default function StatsCard({ icon, label, value, subText }) {
	const Icon = typeof icon === 'function' || (icon && typeof icon === 'object' && icon.$$typeof) ? icon : undefined;
	return <StatCard icon={Icon} label={label} value={value} caption={subText} />;
}
