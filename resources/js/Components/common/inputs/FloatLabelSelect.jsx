import Field from '@/Components/ui/Field';
import Select from '@/Components/ui/Select';
import legacyClassName from '@/Components/ui/legacyClassName';

/**
 * Legado: use `@/Components/ui/Field` + `Select`. Invólucro fino; o rótulo
 * agora fica visível acima do campo (padrão das telas do app).
 */
export default function FloatLabelSelect({
    id,
    name,
    label,
    value,
    onChange,
    children,
    isRequired = false,
    isDisabled = false,
    error,
    helperText,
    containerClassName = '',
    className = '',
}) {
    return (
        <Field id={id} label={label} required={isRequired} error={error} helper={helperText} className={containerClassName}>
            <Select name={name || id} value={value} onChange={onChange} disabled={isDisabled} className={legacyClassName(className)}>
                {children}
            </Select>
        </Field>
    );
}
