import { forwardRef } from 'react';
import { useField } from './Field';
import { CONTROL, CONTROL_SIZES } from './controlStyles';
import cx from './cx';

/**
 * Campo de texto. Dentro de um <Field>, herda id, aria-describedby,
 * aria-invalid e required. `leading`/`trailing` põem conteúdo dentro da borda
 * (ícone, "R$", tecla de atalho).
 */
const Input = forwardRef(function Input(
    { id, size = 'md', leading, trailing, invalid, className = '', wrapperClassName = '', type = 'text', ...props },
    ref,
) {
    const field = useField();
    const isInvalid = invalid ?? field?.invalid;

    const input = (
        <input
            ref={ref}
            id={id ?? field?.id}
            type={type}
            required={props.required ?? field?.required}
            aria-invalid={isInvalid || undefined}
            aria-describedby={props['aria-describedby'] ?? field?.describedBy}
            className={cx(CONTROL, CONTROL_SIZES[size] ?? CONTROL_SIZES.md, leading && 'pl-9', trailing && 'pr-16', className)}
            {...props}
        />
    );

    if (!leading && !trailing) return input;

    return (
        <div className={cx('relative', wrapperClassName)}>
            {leading && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-content-muted [&_svg]:h-4 [&_svg]:w-4">
                    {leading}
                </span>
            )}
            {input}
            {trailing && <span className="absolute inset-y-0 right-2.5 flex items-center">{trailing}</span>}
        </div>
    );
});

export default Input;
