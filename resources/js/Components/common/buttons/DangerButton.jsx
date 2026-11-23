import Button from '@/Components/ui/Button';
import legacyClassName from '@/Components/ui/legacyClassName';

/**
 * Legado: use `@/Components/ui/Button` (variant="danger").
 * Sem `type`, continua "submit" como o <button> antigo. Do `className` antigo
 * só passam classes de layout.
 */
export default function DangerButton({ type = 'submit', className = '', ...props }) {
    return <Button variant="danger" type={type} className={legacyClassName(className)} {...props} />;
}
