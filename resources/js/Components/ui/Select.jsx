import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useField } from './Field';
import { CONTROL, CONTROL_SIZES } from './controlStyles';
import cx from './cx';

/** Select nativo com a seta do kit. Dentro de um <Field>, herda id e aria. */
const Select = forwardRef(function Select({ id, size = 'md', invalid, className = '', children, ...props }, ref) {
    const field = useField();
    const isInvalid = invalid ?? field?.invalid;

    return (
        <div className="relative">
            <select
                ref={ref}
                id={id ?? field?.id}
                required={props.required ?? field?.required}
                aria-invalid={isInvalid || undefined}
                aria-describedby={props['aria-describedby'] ?? field?.describedBy}
                className={cx(CONTROL, CONTROL_SIZES[size] ?? CONTROL_SIZES.md, 'cursor-pointer appearance-none bg-none pr-9', className)}
                {...props}
            >
                {children}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        </div>
    );
});

export default Select;
