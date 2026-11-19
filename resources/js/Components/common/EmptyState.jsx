import UiEmptyState from '@/Components/ui/EmptyState';

/**
 * Legado: use `@/Components/ui/EmptyState`. Os emojis antigos (`icon` em
 * texto) são trocados pelo ícone padrão do kit; um componente lucide passa.
 */
export default function EmptyState({ icon, title, description, action }) {
	const Icon = typeof icon === 'string' || !icon ? undefined : icon;
	return <UiEmptyState icon={Icon} title={title} text={description} action={action} />;
}
