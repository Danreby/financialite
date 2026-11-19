import cx from './cx';

/** Cabeçalho de página: título, subtítulo e ações à direita (empilha no celular). */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
    return (
        <header className={cx('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-content-primary text-balance">{title}</h1>
                {subtitle && <p className="mt-1 max-w-prose text-sm text-content-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
