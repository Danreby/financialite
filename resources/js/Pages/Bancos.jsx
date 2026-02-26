import React, { useState, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import ScrollArea from '@/Components/common/ScrollArea';
import EmptyState from '@/Components/common/EmptyState';
import ConfirmDeleteModal from '@/Components/common/ConfirmDeleteModal';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import BankAccountItem from '@/Components/system/bancos/BankAccountItem';
import BankAccountForm from '@/Components/system/bancos/BankAccountForm';
import EditBankAccountModal from '@/Components/system/bancos/EditBankAccountModal';
import BankTransferForm from '@/Components/system/bancos/BankTransferForm';
import BankTransferHistory from '@/Components/system/bancos/BankTransferHistory';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export default function Bancos({ bankAccounts, stats: initialStats, transfers: initialTransfers = [] }) {
  const initial = useMemo(() => {
    if (Array.isArray(bankAccounts?.data)) return bankAccounts.data;
    if (Array.isArray(bankAccounts)) return bankAccounts;
    return [];
  }, [bankAccounts]);

  const [accounts, setAccounts] = useState(initial);
  const [transfers, setTransfers] = useState(
    Array.isArray(initialTransfers) ? initialTransfers : (initialTransfers?.data || [])
  );
  const [stats, setStats] = useState(initialStats || null);
  const [saving, setSaving] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountBeingEdited, setAccountBeingEdited] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });

  const loadTransfers = async () => {
    try {
      const { bankTransferService } = await import('@/Services/bankService');
      const data = await bankTransferService.list();
      setTransfers(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      // 
    }
  };

  const loadStats = async () => {
    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.stats();
      setStats(data);
    } catch {
      //
    }
  };

  const refreshAccounts = async () => {
    try {
      const { bankAccountService } = await import('@/Services/bankService');
      const data = await bankAccountService.list();
      setAccounts(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      // 
    }
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + parseFloat(acc.balance ?? 0), 0),
    [accounts],
  );

  const openEditModal = (account) => {
    setAccountBeingEdited(account);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updated) => {
    if (updated) {
      refreshAccounts();
      loadStats();
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
      setAccounts((prev) => prev.filter((a) => a.id !== confirmTarget.id));
      loadStats();
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
      refreshAccounts();
      loadStats();
    }
    toast.success('Conta bancária criada com sucesso.');
  };

  const handleTransferSuccess = () => {
    toast.success('Transferência realizada com sucesso.');
    refreshAccounts();
    loadTransfers();
    loadStats();
  };

  const handleCloseEditModal = useCallback(() => {
    if (saving) return;
    setIsEditModalOpen(false);
    setAccountBeingEdited(null);
  }, [saving]);

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
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-medium self-start sm:self-auto flex items-center"
            >
              <span className="mr-1.5">🏦</span> Nova Conta
            </PrimaryButton>
          </header>
        </FadeInItem>

        <FadeInItem type="subtle">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini
              label="Saldo Total"
              value={formatCurrency(stats?.total_balance ?? totalBalance)}
              icon="💰"
              highlight
            />
            <StatMini
              label="Contas Ativas"
              value={accounts.length}
              icon="🏦"
            />
            <StatMini
              label="Receitas Vinculadas"
              value={stats?.total_incomes ?? 0}
              icon="📈"
            />
            <StatMini
              label="Transferências"
              value={transfers.length}
              icon="🔄"
            />
          </div>
        </FadeInItem>

        <FadeInItem type="subtle">
          <section className="rounded-2xl p-4 sm:p-5 shadow-md themed-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
                  <span className="text-base">🏦</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Suas Contas Bancárias
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'} cadastradas
                  </p>
                </div>
              </div>
              {saving && (
                <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Salvando...</span>
              )}
            </div>

            {accounts.length > 0 ? (
              <ScrollArea maxHeightClassName="max-h-[460px] sm:max-h-[520px]" className="pr-1 space-y-2">
                <AnimatePresence mode="popLayout">
                  {accounts.map((account) => (
                    <BankAccountItem
                      key={account.id}
                      account={account}
                      onEdit={openEditModal}
                      onDelete={(payload) => openConfirmDelete(payload)}
                      saving={saving}
                    />
                  ))}
                </AnimatePresence>
              </ScrollArea>
            ) : (
              <EmptyState
                icon="🏦"
                title="Nenhuma conta bancária"
                description="Adicione uma conta bancária para começar a gerenciar seus saldos e transferências."
              />
            )}
          </section>
        </FadeInItem>

        {accounts.length >= 2 && (
          <FadeInItem type="subtle">
            <BankTransferForm accounts={accounts} onSuccess={handleTransferSuccess} />
          </FadeInItem>
        )}

        {transfers.length > 0 && (
          <FadeInItem type="subtle">
            <BankTransferHistory transfers={transfers} />
          </FadeInItem>
        )}
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
    </AuthenticatedLayout>
  );
}

function StatMini({ label, value, icon, highlight = false }) {
  return (
    <div className="rounded-2xl p-3 sm:p-4 shadow-md themed-card flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${highlight ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-theme-accent/10 dark:bg-theme-accent/20'}`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className={`text-lg sm:text-xl font-bold truncate ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
