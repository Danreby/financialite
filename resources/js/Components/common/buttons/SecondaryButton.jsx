import Button from '@/Components/ui/Button';
import legacyClassName from '@/Components/ui/legacyClassName';

/** Legado: use `@/Components/ui/Button` (variant="secondary"). Do `className` antigo só passam classes de layout. */
export default function SecondaryButton({ className = '', ...props }) {
    return <Button variant="secondary" className={legacyClassName(className)} {...props} />;
}
