import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/Components/common/Modal';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';

const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

const PRESETS = [50, 100, 200, 500, 1000, 2000];

function AnimatedBalance({ value, className = '' }) {
    const [displayed, setDisplayed] = useState(value);
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        setDisplayed(value);
        setAnimKey((k) => k + 1);
    }, [value]);

    return (
        <AnimatePresence mode="popLayout">
            <motion.span
                key={animKey}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={className}
            >
                {formatCurrency(displayed)}
            </motion.span>
        </AnimatePresence>
    );
}

export default function BalanceAdjustModal({ isOpen, onClose, account, onSuccess }) {
    const [mode, setMode] = useState('add');
    const [rawAmount, setRawAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const currentBalance = parseFloat(account?.balance ?? 0);

    const parsedAmount = useMemo(() => {
        const v = parseFloat(rawAmount.replace(',', '.'));
        return Number.isNaN(v) || v < 0 ? 0 : v;
    }, [rawAmount]);

    const newBalance = useMemo(() => {
        if (mode === 'add') return currentBalance + parsedAmount;
        return currentBalance - parsedAmount;
    }, [currentBalance, parsedAmount, mode]);

    const delta = newBalance - currentBalance;

    useEffect(() => {
        if (isOpen) {
            setMode('add');
            setRawAmount('');
            setError('');
            setSaving(false);
        }
    }, [isOpen]);

    const applyPreset = useCallback((amount) => {
        setRawAmount(String(amount));
        setError('');
    }, []);

    const handleAmountChange = (e) => {
        let v = e.target.value.replace(/[^0-9.,]/g, '');
        const dotCount = (v.match(/\./g) || []).length + (v.match(/,/g) || []).length;
        if (dotCount > 1) return;
        setRawAmount(v);
        setError('');
    };

    const handleModeSwitch = (next) => {
        setMode(next);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving || !account) return;

        if (parsedAmount <= 0) {
            setError('Informe um valor maior que zero.');
            return;
        }
        if (mode === 'subtract' && parsedAmount > currentBalance) {
            setError('Valor a subtrair é maior que o saldo atual.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const { bankAccountService } = await import('@/Services/bankService');
            const data = await bankAccountService.update(account.id, {
                balance: parseFloat(newBalance.toFixed(2)),
            });
            onSuccess?.(data);
            onClose?.();
        } catch (err) {
            const msg =
                err.response?.data?.errors?.balance?.[0] ||
                err.response?.data?.message ||
                'Não foi possível atualizar o saldo.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!account) return null;

    const accountName = account.bank?.name || account.name || `Conta #${account.id}`;
    const isAdd = mode === 'add';
    const hasAmount = parsedAmount > 0;

    const balanceColor = (v) =>
        v > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : v < 0
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400';

    const newBalanceColor = balanceColor(newBalance);

    return (
        <Modal isOpen={isOpen} onClose={() => !saving && onClose?.()} title="Ajustar Saldo" maxWidth="sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] px-4 py-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--theme-accent), var(--theme-accentHover))' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
                            <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1-1-1V4Zm2 5v7h14V9H3Zm14-2V5H3v2h14ZM5 13a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1Zm6 0a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{accountName}</p>
                        <p className={`text-xs font-medium ${balanceColor(currentBalance)}`}>
                            Saldo atual: {formatCurrency(currentBalance)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('add')}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                            isAdd
                                ? 'bg-white dark:bg-gray-900 shadow-sm text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        Adicionar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('subtract')}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                            !isAdd
                                ? 'bg-white dark:bg-gray-900 shadow-sm text-red-500 dark:text-red-400'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
                        </svg>
                        Subtrair
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                            R$
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={rawAmount}
                            onChange={handleAmountChange}
                            placeholder="0,00"
                            autoFocus
                            className={`w-full rounded-xl border pl-10 pr-4 py-3 text-lg font-bold text-right transition-colors focus:outline-none focus:ring-2 dark:bg-[#0f0f0f] dark:text-gray-100
                                ${isAdd
                                    ? 'border-emerald-200 dark:border-emerald-800/50 focus:border-emerald-400 focus:ring-emerald-400/20 text-emerald-700 dark:text-emerald-300'
                                    : 'border-red-200 dark:border-red-900/50 focus:border-red-400 focus:ring-red-400/20 text-red-600 dark:text-red-400'
                                }`}
                        />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                                    parsedAmount === preset
                                        ? isAdd
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                                        : 'bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.15]'
                                }`}
                            >
                                {isAdd ? '+' : '–'}{formatCurrency(preset).replace('R$\u00a0', '')}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {hasAmount && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.10] bg-gray-50 dark:bg-white/[0.03] p-4 flex items-center justify-between gap-3">
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Atual</span>
                                    <span className={`text-base font-bold ${balanceColor(currentBalance)}`}>
                                        {formatCurrency(currentBalance)}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                    <span className={`text-xs font-bold ${isAdd ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isAdd ? '+' : '–'}{formatCurrency(parsedAmount)}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                        className={`h-4 w-4 ${isAdd ? 'text-emerald-400' : 'text-red-400'}`}>
                                        <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Novo</span>
                                    <AnimatedBalance
                                        value={newBalance}
                                        className={`text-base font-bold ${newBalanceColor}`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-500 dark:text-red-400 text-center -mt-2"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => !saving && onClose?.()}
                        disabled={saving}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <PrimaryButton
                        type="submit"
                        disabled={saving || !hasAmount}
                        className={`rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-50 transition-all ${
                            isAdd
                                ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
                                : 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
                        }`}
                        style={
                            isAdd
                                ? { background: 'var(--theme-accent)' }
                                : { background: 'rgb(239 68 68)' }
                        }
                    >
                        {saving
                            ? 'Salvando...'
                            : isAdd
                            ? `Adicionar ${hasAmount ? formatCurrency(parsedAmount) : ''}`
                            : `Subtrair ${hasAmount ? formatCurrency(parsedAmount) : ''}`}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
