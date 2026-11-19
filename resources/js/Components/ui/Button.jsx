import { forwardRef } from 'react';
import Spinner from './Spinner';
import cx from './cx';

const BASE =
    'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTS = {
    // Destaque da paleta com texto branco; sombra tingida com deslocamento (nada de halo).
    primary:
        'bg-theme-accent text-[rgb(var(--on-accent))] shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_6px_14px_-6px_rgb(var(--accent)/0.6)] ' +
        'hover:bg-theme-accent-hover hover:shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_8px_18px_-6px_rgb(var(--accent)/0.65)]',
    secondary: 'border border-line bg-surface-sunken text-content-primary hover:border-line-strong hover:bg-surface-raised',
    ghost: 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary',
    // Tonal: o vermelho sólido com texto branco não passa de 4,5:1 no escuro.
    danger: 'border border-danger/40 bg-danger-soft text-danger-strong hover:border-danger/70 hover:bg-danger/20',
};

const SIZES = {
    sm: { box: 'h-8 rounded-[10px] px-3 text-xs', icon: 'h-8 w-8 rounded-[10px]', glyph: 'h-3.5 w-3.5' },
    md: { box: 'h-10 rounded-chip px-4 text-sm', icon: 'h-10 w-10 rounded-chip', glyph: 'h-4 w-4' },
};

/**
 * Botão do kit.
 * - variant: primary | secondary | ghost | danger
 * - size: sm | md
 * - icon / iconRight: componente lucide
 * - loading: troca o ícone por um spinner, desabilita e marca aria-busy
 * - iconOnly: quadrado só com o ícone; exige aria-label
 * - as: elemento ou componente (ex.: Link do Inertia)
 */
const Button = forwardRef(function Button(
    {
        as: Tag = 'button',
        variant = 'primary',
        size = 'md',
        icon: Icon,
        iconRight: IconRight,
        iconOnly = false,
        loading = false,
        disabled,
        type,
        className = '',
        children,
        ...props
    },
    ref,
) {
    const s = SIZES[size] ?? SIZES.md;

    if (iconOnly && !props['aria-label'] && import.meta.env?.DEV) {
        console.warn('[ui/Button] botão só com ícone precisa de aria-label.');
    }

    const isButton = Tag === 'button';
    const isDisabled = disabled || loading;

    return (
        <Tag
            ref={ref}
            type={isButton ? type ?? 'button' : type}
            disabled={isButton ? isDisabled : undefined}
            aria-disabled={!isButton && isDisabled ? true : undefined}
            aria-busy={loading || undefined}
            className={cx(BASE, VARIANTS[variant] ?? VARIANTS.primary, iconOnly ? s.icon : s.box, className)}
            {...props}
        >
            {loading ? (
                <Spinner size={size === 'sm' ? 'sm' : 'md'} />
            ) : (
                Icon && <Icon aria-hidden="true" className={s.glyph} />
            )}
            {iconOnly ? null : children}
            {!iconOnly && IconRight && <IconRight aria-hidden="true" className={s.glyph} />}
        </Tag>
    );
});

export default Button;
