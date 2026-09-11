import React, { useEffect, useState } from 'react';
import Modal from '@/Components/common/Modal';
import ScrollArea from '@/Components/common/ScrollArea';
import EmptyState from '@/Components/common/EmptyState';
import { LedgerTypeIcon } from '@/Utils/bankLedgerIcons';
import { formatCurrencyBRL } from '@/Lib/formatters';

const formatDateTime = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

function StatementSkeleton() {
    return (
        <div className="space-y-2" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800 animate-pulse">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-3 w-2/5 rounded bg-gray-100 dark:bg-white/[0.06]" />
                        <div className="h-2.5 w-1/4 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    </div>
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/[0.06] flex-shrink-0" />
                </div>
            ))}
        </div>
    );
}

export default function BankAccountStatementModal({ isOpen, onClose, account }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !account) {
            setEntries([]);
            setError('');
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { bankAccountService } = await import('@/Services/bankService');
                const data = await bankAccountService.ledger(account.id);
                if (!cancelled) {
                    setEntries(Array.isArray(data?.data) ? data.data : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError('Não foi possível carregar o extrato desta conta.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [isOpen, account]);

    const accountName = account?.bank?.name || account?.name || `Conta #${account?.id}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Extrato - ${accountName}`} maxWidth="lg">
            <div className="flex flex-col gap-3">
                {loading && <StatementSkeleton />}

                {!loading && error && (
                    <p className="py-6 text-center text-xs text-red-500 dark:text-red-400">{error}</p>
                )}

                {!loading && !error && entries.length === 0 && (
                    <EmptyState
                        icon="🧾"
                        title="Nenhuma movimentação"
                        description="Essa conta ainda não tem eventos registrados no extrato."
                    />
                )}

                {!loading && !error && entries.length > 0 && (
                    <ScrollArea maxHeightClassName="max-h-[420px] sm:max-h-[480px]" className="pr-1 space-y-2">
                        {entries.map((entry) => {
                            const isCredit = parseFloat(entry.amount) >= 0;
                            return (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0 text-theme-accent">
                                            <LedgerTypeIcon type={entry.type} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {entry.description || entry.type_label}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                {entry.type_label} · {formatDateTime(entry.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p
                                            className={`text-sm font-semibold tabular-nums ${
                                                isCredit
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-red-500 dark:text-red-400'
                                            }`}
                                        >
                                            {isCredit ? '+' : ''}
                                            {formatCurrencyBRL(entry.amount)}
                                        </p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                                            saldo: {formatCurrencyBRL(entry.balance_after)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </ScrollArea>
                )}
            </div>
        </Modal>
    );
}
