import UiEmptyState from '@/Components/ui/EmptyState';

/**
 * Legado: use `@/Components/ui/EmptyState`. `icon` pode ser componente ou
 * elemento (ex.: <FinancialIcon />); emoji em texto vira o ícone padrão do kit.
 */
export default function EmptyState({ icon, title, description, action }) {
	return <UiEmptyState icon={typeof icon === 'string' ? undefined : icon} title={title} text={description} action={action} />;
}
