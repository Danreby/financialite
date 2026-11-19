import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import MoneyText from './MoneyText';
import Skeleton from './Skeleton';
import cx from './cx';

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };
const TONE_CLASS = { positive: 'text-success-strong', negative: 'text-danger-strong', neutral: 'text-content-muted', warning: 'text-warning-strong' };

/**
 * Indicador (KPI) como na referência: chip com ícone + rótulo, valor grande,
 * linha de variação com seta + texto + legenda.
 * - icon: componente lucide
 * - value: número (com `money`, vira MoneyText) ou nó pronto
 * - change: texto da variação ("+4,8%"); trend: up | down | flat
 * - tone: positive | negative | neutral | warning (padrão: up = positivo, down = negativo).
 *   Para gastos, subir é ruim: passe tone="negative" com trend="up".
 * - caption: "vs mês anterior"
 */
export default function StatCard({ label, value, money = false, icon: Icon, change, trend = 'flat', tone, caption, loading = false, className = '' }) {
    const resolvedTone = tone ?? (trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral');
    const TrendIcon = TREND_ICON[trend] ?? Minus;

    return (
        <div className={cx('surface-card flex flex-col gap-3 p-4', className)} aria-busy={loading || undefined}>
            <div className="flex items-center gap-2.5">
                {Icon && (
                    <span className="icon-chip">
                        <Icon aria-hidden="true" />
                    </span>
                )}
                <span className="truncate text-sm font-medium text-content-secondary">{label}</span>
            </div>

            {loading ? (
                <div className="flex flex-col gap-2.5 py-1">
                    <span className="sr-only">Carregando {label}</span>
                    <Skeleton shape="block" className="h-7 w-32" />
                    <Skeleton className="w-40" />
                </div>
            ) : (
                <>
                    <div className="text-[1.625rem] font-semibold leading-8 tracking-tight text-content-primary tabular-nums">
                        {money ? <MoneyText value={value} /> : value}
                    </div>
                    {(change || caption) && (
                        <p className="flex min-w-0 items-center gap-1.5 text-xs">
                            {change && (
                                <span className={cx('inline-flex shrink-0 items-center gap-0.5 font-semibold tabular-nums', TONE_CLASS[resolvedTone])}>
                                    <TrendIcon aria-hidden="true" className="h-3.5 w-3.5" />
                                    {change}
                                </span>
                            )}
                            {caption && <span className="truncate text-content-muted">{caption}</span>}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
