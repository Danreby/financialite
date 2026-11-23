import { createElement, isValidElement } from 'react';

/** Componente (função, forwardRef ou memo), não um elemento já criado. */
export function isComponentType(value) {
    if (typeof value === 'function') return true;
    return !!value && typeof value === 'object' && !isValidElement(value) && '$$typeof' in value;
}

/**
 * Ícone aceito como componente (`Wallet`) ou elemento (`<FinancialIcon />`).
 * Componente: cria com aria-hidden e a classe. Elemento: renderiza como veio.
 * Qualquer outra coisa (texto, emoji, null): usa `fallback` ou nada.
 */
export default function renderIcon(icon, props = {}, fallback = null) {
    if (isValidElement(icon)) return icon;
    const Type = isComponentType(icon) ? icon : fallback;
    return Type ? createElement(Type, { 'aria-hidden': 'true', ...props }) : null;
}
