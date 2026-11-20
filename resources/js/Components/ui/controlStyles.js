/** Estilo comum dos controles de formulário (campo escuro afundado, linha de 1 px, foco na cor da paleta). */
export const CONTROL =
    'block w-full border border-line bg-surface-sunken text-content-primary shadow-none ' +
    'placeholder:text-content-muted transition-[border-color,box-shadow] duration-150 ease-out ' +
    'hover:border-line-strong focus:border-theme-accent focus:outline-none focus:ring-[3px] focus:ring-theme-accent/25 ' +
    'disabled:cursor-not-allowed disabled:opacity-60 ' +
    'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25';

export const CONTROL_SIZES = {
    sm: 'h-8 rounded-[10px] px-2.5 py-0 text-[13px]',
    md: 'h-10 rounded-chip px-3 text-sm',
};
