import { formatCurrencyBRL } from '@/Lib/formatters';
import cx from './cx';

const TONES = {
    neutral: 'text-content-primary',
    positive: 'text-success-strong',
    negative: 'text-danger-strong',
    muted: 'text-content-muted',
};

const MINUS = '\u2212';

/**
 * Valor em reais com números tabulares, sinal e tom.
 * - type="income": "+R$ 10,00" em verde.
 * - type="expense": "−R$ 10,00" neutro (gasto comum não é alerta).
 * - sem type: o sinal segue o valor; tone 'auto' pinta positivo/negativo.
 * - sign: 'auto' | 'always' | 'never'
 */
export default function MoneyText({ value, type, tone, sign = 'auto', as: Tag = 'span', className = '', ...props }) {
    const amount = Number(value) || 0;
    const abs = Math.abs(amount);

    let prefix = '';
    let resolvedTone = tone ?? 'neutral';

    if (type === 'income') {
        prefix = abs > 0 ? '+' : '';
        resolvedTone = tone ?? 'positive';
    } else if (type === 'expense') {
        prefix = abs > 0 ? MINUS : '';
    } else {
        if (amount < 0) prefix = MINUS;
        else if (amount > 0 && sign === 'always') prefix = '+';
        if (tone === 'auto') resolvedTone = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral';
    }
    if (sign === 'never') prefix = '';

    return (
        <Tag className={cx('whitespace-nowrap tabular-nums', TONES[resolvedTone] ?? TONES.neutral, className)} {...props}>
            {prefix}
            {formatCurrencyBRL(abs)}
        </Tag>
    );
}
