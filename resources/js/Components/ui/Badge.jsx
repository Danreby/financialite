import cx from './cx';
import renderIcon from './renderIcon';

const TONES = {
    neutral: '',
    accent: 'pill-accent',
    success: 'pill-success',
    warning: 'pill-warning',
    danger: 'pill-danger',
    info: 'pill-info',
};

/**
 * Selo em pílula. O texto sempre diz o estado; o tom só reforça.
 * Tons: neutral, accent, success, warning, danger, info.
 */
export default function Badge({ tone = 'neutral', icon, className = '', children, ...props }) {
    return (
        <span className={cx('pill', TONES[tone] ?? '', className)} {...props}>
            {renderIcon(icon, { className: 'h-3 w-3' })}
            {children}
        </span>
    );
}

export const PRIORITIES = {
    alta: { label: 'Alta', tone: 'danger' },
    media: { label: 'Média', tone: 'warning' },
    baixa: { label: 'Baixa', tone: 'success' },
};

/** Normaliza 'Alta' | 'média' | 'high'... para alta/media/baixa. */
export function normalizePriority(priority) {
    const key = String(priority ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    if (key === 'high') return 'alta';
    if (key === 'medium') return 'media';
    if (key === 'low') return 'baixa';
    return PRIORITIES[key] ? key : 'baixa';
}

/** Selo de prioridade: Alta (danger), Média (warning), Baixa (success). */
export function PriorityBadge({ priority, className = '' }) {
    const { label, tone } = PRIORITIES[normalizePriority(priority)];
    return (
        <Badge tone={tone} className={className}>
            <span className="sr-only">Prioridade </span>
            {label}
        </Badge>
    );
}
