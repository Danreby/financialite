import { Loader2 } from 'lucide-react';
import cx from './cx';

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' };

/**
 * Indicador de carregamento. Com `label`, anuncia o texto para leitores de
 * tela; sem ele, é só decorativo (o contexto já diz que carrega).
 */
export default function Spinner({ size = 'md', label, className = '' }) {
    return (
        <span role={label ? 'status' : undefined} className={cx('inline-flex items-center', className)}>
            <Loader2 aria-hidden="true" className={cx('animate-spin', SIZES[size] ?? SIZES.md)} />
            {label && <span className="sr-only">{label}</span>}
        </span>
    );
}
