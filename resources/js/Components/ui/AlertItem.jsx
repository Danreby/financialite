import { CornerDownRight } from 'lucide-react';
import { PRIORITIES, PriorityBadge, normalizePriority } from './Badge';
import cx from './cx';
import renderIcon from './renderIcon';

const ICON_TONE = { danger: 'text-danger-strong', warning: 'text-warning-strong', success: 'text-success-strong' };

/**
 * Cartão de alerta como os "AI Alerts" da referência: título, selo de
 * prioridade, descrição e uma linha secundária com ícone no tom da prioridade.
 */
export default function AlertItem({ title, priority = 'baixa', description, detail, detailIcon, action, className = '', ...props }) {
    const { tone } = PRIORITIES[normalizePriority(priority)];

    return (
        <article className={cx('rounded-[12px] border border-line bg-surface-sunken/60 p-3.5', className)} {...props}>
            <header className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-5 text-content-primary">{title}</h3>
                <PriorityBadge priority={priority} className="mt-px shrink-0" />
            </header>
            {description && <p className="mt-1 text-xs leading-5 text-content-muted">{description}</p>}
            {detail && (
                <p className="mt-2.5 flex items-start gap-2 border-t border-line pt-2.5 text-xs leading-5 text-content-secondary">
                    <span className={cx('mt-0.5 inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5', ICON_TONE[tone])}>{renderIcon(detailIcon, {}, CornerDownRight)}</span>
                    <span>{detail}</span>
                </p>
            )}
            {action && <div className="mt-3">{action}</div>}
        </article>
    );
}
