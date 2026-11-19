import Button from '@/Components/ui/Button'

/** Legado: use `@/Components/ui/Button` (variant="primary").
 * Sem `type`, continua "submit" como o <button> antigo. */
export default function PrimaryButton({ type = 'submit', ...props }) {
  return <Button variant="primary" type={type} {...props} />
}
