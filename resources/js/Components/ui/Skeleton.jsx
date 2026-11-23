import cx from './cx';

const SHAPES = { text: 'h-3 rounded', block: 'rounded-chip', circle: 'rounded-full' };

/**
 * Bloco de carregamento. Decorativo: quem envolve deve marcar a região com
 * aria-busy e um texto "Carregando" para leitor de tela.
 */
export default function Skeleton({ shape = 'text', className = '', lines }) {
    if (lines > 1) {
        return (
            <span aria-hidden="true" className="flex flex-col gap-2">
                {Array.from({ length: lines }, (_, i) => (
                    <span key={i} className={cx('block animate-pulse bg-line', SHAPES.text, i === lines - 1 ? 'w-2/3' : 'w-full', className)} />
                ))}
            </span>
        );
    }

    return <span aria-hidden="true" className={cx('block animate-pulse bg-line', SHAPES[shape] ?? SHAPES.text, className)} />;
}
