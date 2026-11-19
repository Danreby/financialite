/*
 * Os invólucros antigos (PrimaryButton, TextInput...) recebiam classes de
 * tamanho, raio, cor e tipografia das páginas ("rounded-xl px-5 py-2 text-sm").
 * Elas brigariam com o visual do kit, então só passam classes de layout:
 * largura, margem (inclusive lógicas ms-/me-), flex/grid do item, self/order,
 * display (block, inline, flex, inline-flex) e visibilidade, com ou sem prefixo
 * de breakpoint.
 */
const LAYOUT = /^(-?m[trblxyse]?-|w-|min-w-|max-w-|flex-1$|flex-auto$|flex-none$|grow|shrink|basis-|self-|justify-self-|place-self-|order-|col-|row-|hidden$|sr-only$|not-sr-only$|block$|inline$|flex$|inline-flex$|mt-auto$|ml-auto$|mr-auto$|mx-auto$)/;

export default function legacyClassName(className = '') {
    return String(className)
        .split(/\s+/)
        .filter((token) => {
            if (!token) return false;
            const base = token.split(':').pop();
            return LAYOUT.test(base);
        })
        .join(' ');
}
