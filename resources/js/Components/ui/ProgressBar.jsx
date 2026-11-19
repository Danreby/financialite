import cx from './cx';

const FILL = { accent: 'bg-theme-accent', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' };

const pct = (n) => `${Math.round(n).toLocaleString('pt-BR')}%`;

/**
 * Barra de progresso (role=progressbar). Passa do limite: a barra fica cheia,
 * vermelha, e o texto diz quanto passou (nunca só pela cor).
 * - tone: 'auto' (paleta → aviso em warnAt → perigo acima do máximo) ou fixo
 */
export default function ProgressBar({
    value = 0,
    max = 100,
    label,
    valueText,
    showValue = true,
    tone = 'auto',
    warnAt = 0.8,
    size = 'md',
    className = '',
    'aria-label': ariaLabel,
}) {
    const ratio = max > 0 ? value / max : 0;
    const over = ratio > 1;
    const resolved = tone !== 'auto' ? tone : over ? 'danger' : ratio >= warnAt ? 'warning' : 'accent';
    const text = valueText ?? (over ? `${pct(ratio * 100)}, acima do limite em ${pct((ratio - 1) * 100)}` : pct(ratio * 100));

    return (
        <div className={cx('w-full', className)}>
            {(label || showValue) && (
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                    {label && <span className="truncate font-medium text-content-secondary">{label}</span>}
                    {showValue && (
                        <span className={cx('shrink-0 tabular-nums', over ? 'font-semibold text-danger-strong' : 'text-content-muted')}>
                            {text}
                        </span>
                    )}
                </div>
            )}
            <div
                role="progressbar"
                aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={Math.min(Math.max(value, 0), max)}
                aria-valuetext={text}
                className={cx('overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line', size === 'sm' ? 'h-1.5' : 'h-2')}
            >
                <div
                    className={cx('h-full rounded-full transition-[width] duration-300 ease-out', FILL[resolved] ?? FILL.accent)}
                    style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
                />
            </div>
        </div>
    );
}
