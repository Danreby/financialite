import Button from '@/Components/ui/Button';

/** Legado: use `@/Components/ui/Button` (variant="danger").
 * Sem `type`, continua "submit" como o <button> antigo. */
export default function DangerButton({ type = 'submit', ...props }) {
    return <Button variant="danger" type={type} {...props} />;
}
