import React, { useState, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import { Plus, Landmark, TrendingUp, Activity } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import EmptyState from '@/Components/common/EmptyState';
import ConfirmDeleteModal from '@/Components/common/ConfirmDeleteModal';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import AnimatedCurrency from '@/Components/common/AnimatedCurrency';
import BankAccountCard from '@/Components/system/bancos/BankAccountCard';
import BankAccountForm from '@/Components/system/bancos/BankAccountForm';
import EditBankAccountModal from '@/Components/system/bancos/EditBankAccountModal';
import BankTransferForm from '@/Components/system/bancos/BankTransferForm';
import BalanceAdjustModal from '@/Components/system/bancos/BalanceAdjustModal';
import BankAccountStatementModal from '@/Components/system/bancos/BankAccountStatementModal';
import BankActivityFeed from '@/Components/system/bancos/BankActivityFeed';
import { formatCurrencyBRL } from '@/Lib/formatters';

export default function Bancos({ stats: initialStats, activity: initialActivity }) {
  const [stats, setStats] = useState(initialStats || { total_balance: 0, total_accounts: 0, total_incomes: 0, accounts: [] });
  const [saving, setSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountBeingEdited, setAccountBeingEdited] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [accountBeingAdjusted, setAccountBeingAdjusted] = useState(null);

  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [accountForStatement, setAccountForStatement] = useState(null);

  const accounts = useMemo(
    () => (Array.isArray(stats?.accounts) ? stats.accounts : []),
    [stats]
  );

  const incomeSourceCount = useMemo(
    () => accounts.reduce((sum, acc) => sum + (acc.income_count || 0), 0),
    [accounts]
  );

  const bumpRefresh = () => setRefreshTick((v) => v + 1);

  const loadStats = async () => {
    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.stats();
      setStats(data);
    } catch {
      //
    }
  };

  const openEditModal = (account) => {
    setAccountBeingEdited(account);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updated) => {
    if (updated) {
      loadStats();
      bumpRefresh();
    }
    toast.success('Saldo atualizado com sucesso.');
    setIsEditModalOpen(false);
    setAccountBeingEdited(null);
  };

  const openConfirmDelete = (payload) => {
    setConfirmTarget({ type: 'bank', id: payload.bankUserId, name: payload.name });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget.id) {
      setIsConfirmModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const { bankAccountService } = await import('@/Services/bankService');
      await bankAccountService.delete(confirmTarget.id);
      loadStats();
      bumpRefresh();
      toast.success('Conta bancária removida.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível remover a conta.');
    } finally {
      setSaving(false);
      setIsConfirmModalOpen(false);
      setConfirmTarget({ type: null, id: null, name: '' });
    }
  };

  const handleCancelConfirm = useCallback(() => {
    if (saving) return;
    setIsConfirmModalOpen(false);
    setConfirmTarget({ type: null, id: null, name: '' });
  }, [saving]);

  const handleFormSuccess = (data) => {
    if (data) {
      loadStats();
      bumpRefresh();
    }
    toast.success('Conta bancária criada com sucesso.');
  };

  const openAdjustModal = (account) => {
    setAccountBeingAdjusted(account);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSuccess = (updated) => {
    if (updated) {
      loadStats();
      bumpRefresh();
    }
    toast.success('Saldo ajustado com sucesso.');
    setIsAdjustModalOpen(false);
    setAccountBeingAdjusted(null);
  };

  const handleCloseAdjustModal = useCallback(() => {
    setIsAdjustModalOpen(false);
    setAccountBeingAdjusted(null);
  }, []);

  const handleTransferSuccess = () => {
    toast.success('Transferência realizada com sucesso.');
    loadStats();
    bumpRefresh();
  };

  const handleCloseEditModal = useCallback(() => {
    if (saving) return;
    setIsEditModalOpen(false);
    setAccountBeingEdited(null);
  }, [saving]);

  const openStatementModal = (account) => {
    setAccountForStatement(account);
    setIsStatementOpen(true);
  };

  const handleCloseStatementModal = useCallback(() => {
    setIsStatementOpen(false);
    setAccountForStatement(null);
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title="Bancos" />
      <FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
        <FadeInItem type="fast">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Bancos</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Gerencie suas contas bancárias e transferências.
              </p>
            </div>
            <PrimaryButton
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="rounded-full px-4 py-2 text-xs sm:text-sm font-medium self-start sm:self-auto inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nova Conta
            </PrimaryButton>
          </header>
        </FadeInItem>

        <FadeInItem type="subtle">
          <section className="rounded-2xl p-5 sm:p-6 shadow-md themed-card grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 lg:items-center">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Saldo Total</p>
              <AnimatedCurrency
                value={stats?.total_balance ?? 0}
                className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="themed-strip rounded-2xl overflow-hidden grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/[0.06] lg:min-w-[380px]">
              <div className="min-w-0 p-3.5">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Landmark className="h-3.5 w-3.5 shrink-0 text-theme-accent" aria-hidden="true" />
                  <span className="truncate text-[11px] font-medium">Contas</span>
                </div>
                <div className="mt-1.5 truncate text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {stats?.total_accounts ?? accounts.length}
                </div>
              </div>
              <div className="min-w-0 p-3.5">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-theme-accent" aria-hidden="true" />
                  <span className="truncate text-[11px] font-medium">Receitas</span>
                </div>
                <div className="mt-1.5 truncate text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {incomeSourceCount}
                </div>
                <div className="mt-0.5 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyBRL(stats?.total_incomes ?? 0)}/mês
                </div>
              </div>
              <div className="min-w-0 p-3.5">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Activity className="h-3.5 w-3.5 shrink-0 text-theme-accent" aria-hidden="true" />
                  <span className="truncate text-[11px] font-medium">Movimentações</span>
                </div>
                <div className="mt-1.5 truncate text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {initialActivity?.total ?? 0}
                </div>
              </div>
            </div>
          </section>
        </FadeInItem>

        <FadeInItem type="subtle">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Suas Contas Bancárias
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                {accounts.length} {accounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
              </p>
            </div>
            {saving && (
              <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Salvando...</span>
            )}
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {accounts.map((account) => (
                  <BankAccountCard
                    key={account.id}
                    account={account}
                    onEdit={openEditModal}
                    onDelete={(payload) => openConfirmDelete(payload)}
                    onAdjust={openAdjustModal}
                    onStatement={openStatementModal}
                    saving={saving}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl shadow-md themed-card p-4">
              <EmptyState
                icon="🏦"
                title="Nenhuma conta bancária"
                description="Adicione uma conta bancária para começar a gerenciar seus saldos e transferências."
              />
            </div>
          )}
        </FadeInItem>

        {accounts.length >= 2 && (
          <FadeInItem type="subtle">
            <BankTransferForm accounts={accounts} onSuccess={handleTransferSuccess} />
          </FadeInItem>
        )}

        <FadeInItem type="subtle">
          <BankActivityFeed
            initialEntries={initialActivity?.data || []}
            initialPagination={
              initialActivity
                ? {
                    current_page: initialActivity.current_page,
                    last_page: initialActivity.last_page,
                    total: initialActivity.total,
                  }
                : null
            }
            refreshKey={refreshTick}
          />
        </FadeInItem>
      </FadeInContainer>

      <BankAccountForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        existingAccounts={accounts}
      />

      <EditBankAccountModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        account={accountBeingEdited}
        onSuccess={handleEditSuccess}
        saving={saving}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelConfirm}
        target={confirmTarget}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />

      <BalanceAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseAdjustModal}
        account={accountBeingAdjusted}
        onSuccess={handleAdjustSuccess}
      />

      <BankAccountStatementModal
        isOpen={isStatementOpen}
        onClose={handleCloseStatementModal}
        account={accountForStatement}
      />
    </AuthenticatedLayout>
  );
}
