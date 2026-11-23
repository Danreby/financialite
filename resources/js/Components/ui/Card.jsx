import cx from './cx';

const PADDING = { none: '', sm: 'p-4', md: 'p-5' };

/**
 * Card da direção nova (.surface-card): grafite com realce no topo, borda
 * translúcida e raio de 16 px. Cabeçalho opcional com título, subtítulo e ações.
 */
export default function Card({
    as: Tag = 'section',
    title,
    titleAs: TitleTag = 'h2',
    subtitle,
    actions,
    padding = 'md',
    className = '',
    bodyClassName = '',
    children,
    ...props
}) {
    const hasHeader = title || subtitle || actions;
    const pad = PADDING[padding] ?? PADDING.md;

    return (
        <Tag className={cx('surface-card', className)} {...props}>
            {hasHeader && (
                <header className={cx('flex items-start justify-between gap-4', pad, children && 'pb-0')}>
                    <div className="min-w-0">
                        {title && <TitleTag className="text-[15px] font-semibold leading-6 text-content-primary">{title}</TitleTag>}
                        {subtitle && <p className="mt-0.5 text-sm text-content-muted">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                </header>
            )}
            {children && <div className={cx(pad, hasHeader && padding !== 'none' && 'pt-4', bodyClassName)}>{children}</div>}
        </Tag>
    );
}
