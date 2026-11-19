import { createContext, useContext, useId } from 'react';
import cx from './cx';

const FieldContext = createContext(null);

/** Lê o id e os atributos de acessibilidade do Field mais próximo (ou nada). */
export function useField() {
    return useContext(FieldContext);
}

/**
 * Campo com rótulo visível acima, ajuda e erro ligados ao controle por
 * aria-describedby e aria-invalid. O controle filho (Input, Select,
 * MoneyInput, SearchInput) pega o id daqui sozinho.
 */
export default function Field({ id, label, helper, error, required = false, optional = false, className = '', children }) {
    const autoId = useId();
    const fieldId = id || `f${autoId.replace(/:/g, '')}`;
    const helperId = helper ? `${fieldId}-ajuda` : null;
    const errorId = error ? `${fieldId}-erro` : null;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
        <FieldContext.Provider value={{ id: fieldId, describedBy, invalid: !!error, required }}>
            <div className={cx('flex flex-col gap-1.5', className)}>
                {label && (
                    <label htmlFor={fieldId} className="text-[13px] font-medium text-content-secondary">
                        {label}
                        {required && (
                            <span className="ml-0.5 text-danger-strong" aria-hidden="true">
                                *
                            </span>
                        )}
                        {optional && <span className="ml-1 font-normal text-content-muted">(opcional)</span>}
                    </label>
                )}
                {children}
                {error && (
                    <p id={errorId} className="text-xs font-medium text-danger-strong">
                        {error}
                    </p>
                )}
                {helper && (
                    <p id={helperId} className="text-xs text-content-muted">
                        {helper}
                    </p>
                )}
            </div>
        </FieldContext.Provider>
    );
}
