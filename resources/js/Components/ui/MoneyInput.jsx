import { forwardRef, useEffect, useRef } from 'react';
import { useCurrencyInput } from '@/Hooks/useCurrencyInput';
import Input from './Input';

/**
 * Valor em reais: mostra "1.234,56" com o prefixo R$ e devolve o número em
 * `onValueChange(numero)`. Aceita `value` numérico (controlado).
 */
const MoneyInput = forwardRef(function MoneyInput({ value, onValueChange, placeholder = '0,00', ...props }, ref) {
    const { displayValue, numericValue, handleChange, setFromNumeric } = useCurrencyInput(value ?? '');
    const lastEmitted = useRef(numericValue);

    // Valor novo vindo de fora (ex.: reset do formulário).
    useEffect(() => {
        const external = Number(value) || 0;
        if (value !== undefined && external !== lastEmitted.current) {
            lastEmitted.current = external;
            setFromNumeric(value === '' || value === null ? '' : external);
        }
    }, [value, setFromNumeric]);

    useEffect(() => {
        if (numericValue !== lastEmitted.current) {
            lastEmitted.current = numericValue;
            onValueChange?.(numericValue);
        }
    }, [numericValue]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Input
            ref={ref}
            inputMode="decimal"
            autoComplete="off"
            leading={<span className="font-medium">R$</span>}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            className="tabular-nums"
            {...props}
        />
    );
});

export default MoneyInput;
