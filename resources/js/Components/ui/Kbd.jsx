import cx from './cx';

/** Tecla de atalho. Ex.: <Kbd>Ctrl K</Kbd>. */
export default function Kbd({ children, className = '' }) {
    return (
        <kbd
            className={cx(
                'inline-flex h-5 items-center rounded-md border border-line bg-surface-raised px-1.5 font-sans text-[11px] font-medium leading-none text-content-muted',
                className,
            )}
        >
            {children}
        </kbd>
    );
}
