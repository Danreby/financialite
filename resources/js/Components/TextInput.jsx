import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Input from '@/Components/ui/Input';
import legacyClassName from '@/Components/ui/legacyClassName';

/** Legado: use `@/Components/ui/Input` (dentro de um `Field`). Invólucro fino. */
export default forwardRef(function TextInput({ isFocused = false, className = '', ...props }, ref) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) localRef.current?.focus();
    }, [isFocused]);

    return <Input ref={localRef} className={legacyClassName(className)} {...props} />;
});
