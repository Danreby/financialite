import React, { useMemo, memo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import IncomeSection from '@/Components/system/income/IncomeSection';
import SavingsSection from '@/Components/system/savings/SavingsSection';
import UserStatsCard from '@/Components/system/profile/UserStatsCard';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const ProfileHero = memo(function ProfileHero({ user, stats }) {
  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const memberSince = stats?.member_since ?? '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl shadow-md themed-card"
    >
      <div
        className="absolute inset-x-0 top-0 h-24 sm:h-28 pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(135deg, var(--theme-primary, #be123c) 0%, var(--theme-accent, #f43f5e) 60%, transparent 100%)',
          opacity: 0.92,
        }}
      />

      <div className="px-5 pb-5 mt-[95px] sm:px-6 sm:pb-6 relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5 -mt-10 sm:-mt-12">
          <div
            className="flex h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 items-center justify-center rounded-2xl text-2xl sm:text-3xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-900 z-20"
            style={{
              background:
                'linear-gradient(135deg, var(--theme-primary, #be123c), var(--theme-accent, #f43f5e))',
            }}
          >
            {initials || '👤'}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              {user?.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span>✉️</span> {user?.email}
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>📞</span> {user.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span>📅</span> Membro desde {memberSince}
              </span>
              {user?.email_verified_at ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800">
                  ✓ Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800">
                  ⚠ Não verificado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const SectionCard = memo(function SectionCard({ icon, title, description, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl shadow-md themed-card overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800/60 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-theme-accent/10 dark:bg-theme-accent/15">
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.div>
  );
});

const DangerZone = memo(function DangerZone() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-red-200 bg-red-50/40 shadow-sm dark:border-red-900/40 dark:bg-red-950/10 overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-red-200 dark:border-red-900/40 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
          <span className="text-lg">⚠️</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 leading-tight">
            Zona de Perigo
          </h2>
          <p className="text-[11px] text-red-600/70 dark:text-red-500/70 mt-0.5 leading-tight">
            Ações irreversíveis que afetam permanentemente sua conta
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <DeleteUserForm />
      </div>
    </motion.div>
  );
});

export default function Edit({
  mustVerifyEmail,
  status,
  bankAccounts = [],
  bankAccountsList = [],
  incomes = [],
  totalMonthlyIncome = 0,
  savingsGoals = [],
  savingsSummary = {},
  userStats = {},
}) {
  const { auth } = usePage().props;
  const user = auth?.user;

  return (
    <AuthenticatedLayout>
      <Head title="Perfil" />

      <FadeInContainer
        type="container"
        stagger
        className="w-full max-w-[1200px] mx-auto px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 space-y-4"
      >
        <FadeInItem type="fast">
          <ProfileHero user={user} stats={userStats} />
        </FadeInItem>

        <FadeInItem type="subtle">
          <UserStatsCard stats={userStats} />
        </FadeInItem>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            icon="👤"
            title="Informações Pessoais"
            description="Atualize seu nome, e-mail e telefone"
          >
            <UpdateProfileInformationForm
              mustVerifyEmail={mustVerifyEmail}
              status={status}
            />
          </SectionCard>

          <SectionCard
            icon="🔒"
            title="Segurança"
            description="Altere sua senha de acesso"
          >
            <UpdatePasswordForm />
          </SectionCard>
        </div>

        <SectionCard
          icon="💵"
          title="Minhas Rendas"
          description="Gerencie suas fontes de renda e vínculos bancários"
        >
          <IncomeSection
            incomes={incomes}
            totalMonthlyIncome={totalMonthlyIncome}
            bankAccounts={bankAccounts}
            bankAccountsList={bankAccountsList}
          />
        </SectionCard>

        <SectionCard
          icon="🎯"
          title="Metas de Economia"
          description="Acompanhe e gerencie seus objetivos financeiros"
        >
          <SavingsSection
            savingsGoals={savingsGoals}
            savingsSummary={savingsSummary}
          />
        </SectionCard>

        <DangerZone />
      </FadeInContainer>
    </AuthenticatedLayout>
  );
}