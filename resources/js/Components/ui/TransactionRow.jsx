import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import Badge from './Badge';
import MoneyText from './MoneyText';
import cx from './cx';

const TYPE_ICON = { income: ArrowDownLeft, expense: ArrowUpRight, transfer: Repeat };
const STATUS = {
    pago: { label: 'Pago', tone: 'success' },
    pendente: { label: 'Pendente', tone: 'warning' },
    vencido: { label: 'Vencido', tone: 'danger' },
};

/**
 * Linha de transação canônica (só props, sem busca de dados).
 * - type: income | expense | transfer
 * - meta: textos curtos da segunda linha (categoria, data, forma de pagamento)
 * - status: pago | pendente | vencido (opcional)
 * - icon: componente lucide (padrão pelo tipo)
 * - actions: botões à direita
 */
export default function TransactionRow({ description, amount, type = 'expense', meta = [], status, icon, actions, as: Tag = 'div', className = '', ...props }) {
    const Icon = icon ?? TYPE_ICON[type] ?? ArrowUpRight;
    const st = status ? STATUS[status] : null;
    const parts = meta.filter(Boolean);

    return (
        <Tag className={cx('flex items-center gap-3 rounded-chip px-2 py-2.5 transition-colors duration-150 hover:bg-surface-sunken/70', className)} {...props}>
            <span className={cx('icon-chip', type === 'income' && 'text-success-strong')}>
                <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content-primary">{description}</p>
                {parts.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-content-muted">
                        {parts.map((part, i) => (
                            <span key={i}>
                                {i > 0 && <span aria-hidden="true"> · </span>}
                                {part}
                            </span>
                        ))}
                    </p>
                )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
                <MoneyText value={amount} type={type === 'transfer' ? undefined : type} className="text-sm font-semibold" />
                {st && <Badge tone={st.tone}>{st.label}</Badge>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </Tag>
    );
}
