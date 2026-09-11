import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Landmark } from 'lucide-react';
import EmptyState from '@/Components/common/EmptyState';
import { LedgerTypeIcon } from '@/Utils/bankLedgerIcons';
import { formatCurrencyBRL } from '@/Lib/formatters';

const formatDateTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function BankActivityFeed({ initialEntries = [], initialPagination = null, refreshKey = 0 }) {
  const [entries, setEntries] = useState(initialEntries);
  const [pagination, setPagination] = useState(initialPagination);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFirstRun = useRef(true);

  const hasMore = pagination && pagination.current_page < pagination.last_page;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { bankAccountService } = await import('@/Services/bankService');
        const data = await bankAccountService.activity({ page: 1 });
        if (cancelled) return;
        setEntries(data?.data || []);
        setPagination({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
      } catch {
        // keep previous entries on failure
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.activity({ page: pagination.current_page + 1 });
      setEntries((prev) => [...prev, ...(data?.data || [])]);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch {
      // silently ignore, user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, pagination]);

  return (
    <section className="rounded-2xl p-4 sm:p-5 shadow-md themed-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
          <Activity className="h-4 w-4 text-theme-accent" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            Atividade Recente
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {pagination?.total ?? entries.length} {(pagination?.total ?? entries.length) === 1 ? 'evento registrado' : 'eventos registrados'}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Nenhuma movimentação ainda"
          description="Assim que você receber, gastar ou transferir dinheiro, a atividade aparece aqui."
        />
      ) : (
        <>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {entries.map((entry) => {
                const isCredit = parseFloat(entry.amount) >= 0;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0 text-theme-accent">
                      <LedgerTypeIcon type={entry.type} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {entry.description || entry.type_label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                        {entry.bank_name && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Landmark className="h-2.5 w-2.5 flex-shrink-0" strokeWidth={2} />
                            {entry.bank_name}
                          </span>
                        )}
                        <span className="flex-shrink-0">{formatDateTime(entry.created_at)}</span>
                      </div>
                    </div>

                    <p
                      className={`text-sm font-semibold flex-shrink-0 tabular-nums ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {formatCurrencyBRL(entry.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-theme-accent hover:bg-theme-accent/10 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
