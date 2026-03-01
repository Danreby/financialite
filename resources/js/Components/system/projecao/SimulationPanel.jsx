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
        <form onSubmit={handleAdd} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Descrição
                </label>
                <input
                    ref={titleRef}
                    type="text"
                    value={form.title}
                    onChange={set('title')}
                    placeholder="Ex: Notebook, Viagem, Roupas..."
                    maxLength={100}
                    required
                    className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Valor (R$)
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={set('amount')}
                        onKeyDown={handleDecimalKeyDown}
                        placeholder="0,00"
                        required
                        className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
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
                        className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none"
                    />
                </div>
            </div>

            {parsedAmount > 0 && parsedInstallments > 1 && (
                <div
                    className="-mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
                        color: 'var(--theme-accent)',
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                    <span className="font-semibold">{parsedInstallments}× {formatCurrencyBRL(installmentAmount)}</span>
                    <span className="text-[10px] opacity-75">por mês</span>
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'credit', label: 'Crédito', icon: '💳' },
                        { value: 'debit',  label: 'Débito',  icon: '🏦' },
                    ].map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}
                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold border transition ${
                                form.type === t.value
                                    ? 'border-transparent'
                                    : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                            }`}
                            style={form.type === t.value ? {
                                backgroundColor: 'color-mix(in srgb, var(--theme-accent) 13%, transparent)',
                                color: 'var(--theme-accent)',
                                borderColor: 'color-mix(in srgb, var(--theme-accent) 40%, transparent)',
                            } : {}}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Mês de início
                    </label>
                    <input
                        type="month"
                        value={form.startMonth}
                        onChange={set('startMonth')}
                        className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none"
                    />
                </div>

                {form.type === 'credit' && bankAccounts.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Cartão
                        </label>
                        <select
                            value={form.bankAccountId}
                            onChange={set('bankAccountId')}
                            className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none dark:bg-[#0f0f0f]"
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
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Categoria
                    </label>
                    <select
                        value={form.categoryId}
                        onChange={set('categoryId')}
                        className="w-full rounded-lg themed-input px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none dark:bg-[#0f0f0f]"
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
                className="themed-button-primary w-full rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                + Adicionar simulação
            </button>
        </form>
    );
}
