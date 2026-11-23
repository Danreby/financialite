import Button from '@/Components/ui/Button'
import legacyClassName from '@/Components/ui/legacyClassName'

/**
 * Legado: use `@/Components/ui/Button` (variant="primary").
 * Sem `type`, continua "submit" como o <button> antigo. Do `className` antigo
 * só passam classes de layout (largura, margem...); tamanho e raio são do kit.
 */
export default function PrimaryButton({ type = 'submit', className = '', ...props }) {
  return <Button variant="primary" type={type} className={legacyClassName(className)} {...props} />
}
