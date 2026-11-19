import cx from './cx';

/**
 * Primitivas de tabela no estilo calmo da referência: cabeçalho apagado,
 * linhas finas, números tabulares e hover na linha.
 * Table (com rolagem horizontal), THead, TBody, TRow, TH, TCell.
 */
export function Table({ caption, className = '', children, ...props }) {
    return (
        <div className="-mx-1 overflow-x-auto px-1">
            <table className={cx('w-full border-collapse text-left text-sm tabular-nums', className)} {...props}>
                {caption && <caption className="sr-only">{caption}</caption>}
                {children}
            </table>
        </div>
    );
}

export function THead({ children, className = '' }) {
    return <thead className={className}>{children}</thead>;
}

export function TBody({ children, className = '' }) {
    return <tbody className={className}>{children}</tbody>;
}

export function TRow({ children, className = '', ...props }) {
    return (
        <tr className={cx('border-b border-line transition-colors duration-150 last:border-0 [tbody_&]:hover:bg-surface-sunken/70', className)} {...props}>
            {children}
        </tr>
    );
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function TH({ children, align = 'left', className = '', ...props }) {
    return (
        <th scope="col" className={cx('whitespace-nowrap px-3 pb-2.5 pt-1 text-xs font-medium text-content-muted', ALIGN[align], className)} {...props}>
            {children}
        </th>
    );
}

export function TCell({ children, align = 'left', className = '', ...props }) {
    return (
        <td className={cx('px-3 py-3 text-content-secondary', ALIGN[align], className)} {...props}>
            {children}
        </td>
    );
}

export default Table;
