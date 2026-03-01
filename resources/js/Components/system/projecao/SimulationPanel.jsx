import React, { useState, useRef } from 'react';
import { useDecimalInput, useNumericInput } from '@/Hooks/useNumericInput';
import { formatCurrencyBRL } from '@/Lib/formatters';

const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7);

const initialForm = () => ({
    title:       '',
    amount:      '',
    installments: '1',
    type:        'credit',
    bankAccountId: '',
    categoryId:  '',
    startMonth:  CURRENT_MONTH(),
});

export default function SimulationPanel({ bankAccounts = [], categories = [], onAdd }) {
    const [form, setForm] = useState(initialForm());
    const titleRef = useRef(null);

    const handleDecimalKeyDown = useDecimalInput();
    const handleNumericKeyDown = useNumericInput();

    const parsedAmount      = parseFloat(form.amount.replace(',', '.')) || 0;
    const parsedInstallments = Math.max(1, Math.min(360, parseInt(form.installments, 10) || 1));
    const installmentAmount = parsedAmount > 0 ? parsedAmount / parsedInstallments : 0;

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleAdd = (e) => {
        e.preventDefault();
        if (!form.title.trim() || parsedAmount <= 0) return;

        const selectedCategory = categories.find((c) => String(c.id) === String(form.categoryId));
        const selectedCard     = bankAccounts.find((b) => String(b.id) === String(form.bankAccountId));

        onAdd({
            id:               crypto.randomUUID(),
            title:            form.title.trim(),
            amount:           parsedAmount,
            installments:     parsedInstallments,
            installmentAmount,
            type:             form.type,
            bankAccountId:    form.bankAccountId,
            bankName:         selectedCard?.name ?? null,
            categoryId:       form.categoryId,
            categoryName:     selectedCategory?.name ?? null,
            categoryColor:    selectedCategory?.color ?? null,
            categoryIcon:     selectedCategory?.icon ?? null,
            startMonth:       form.startMonth,
        });

        setForm(initialForm());
        titleRef.current?.focus();
    };

    return (
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Título da compra
                </label>
                <input
                    ref={titleRef}
                    type="text"
                    value={form.title}
                    onChange={set('title')}
                    placeholder="Ex: Notebook, Viagem, Roupas..."
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 themed-focus outline-none transition"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Valor total (R$)
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={set('amount')}
                        onKeyDown={handleDecimalKeyDown}
                        placeholder="0,00"
                        required
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 themed-focus outline-none transition"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Parcelas
                    </label>
                    <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={360}
                        value={form.installments}
                        onChange={set('installments')}
                        onKeyDown={handleNumericKeyDown}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 themed-focus outline-none transition"
                    />
                </div>
            </div>

            {parsedAmount > 0 && parsedInstallments > 1 && (
                <p className="text-xs text-theme-accent font-medium -mt-1">
                    {parsedInstallments}× de {formatCurrencyBRL(installmentAmount)}
                </p>
            )}

            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tipo
                </label>
                <div className="flex gap-2">
                    {['credit', 'debit'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-medium border transition ${
                                form.type === t
                                    ? 'themed-selected border-transparent'
                                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {t === 'credit' ? 'Crédito' : 'Débito'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Mês de início
                    </label>
                    <input
                        type="month"
                        value={form.startMonth}
                        onChange={set('startMonth')}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 themed-focus outline-none transition"
                    />
                </div>

                {form.type === 'credit' && bankAccounts.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Cartão
                        </label>
                        <select
                            value={form.bankAccountId}
                            onChange={set('bankAccountId')}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 themed-focus outline-none transition"
                        >
                            <option value="">Nenhum</option>
                            {bankAccounts.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {categories.length > 0 && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Categoria
                    </label>
                    <select
                        value={form.categoryId}
                        onChange={set('categoryId')}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 themed-focus outline-none transition"
                    >
                        <option value="">Sem categoria</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <button
                type="submit"
                disabled={!form.title.trim() || parsedAmount <= 0}
                className="mt-1 themed-button-primary w-full rounded-lg py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Adicionar à simulação
            </button>
        </form>
    );
}
