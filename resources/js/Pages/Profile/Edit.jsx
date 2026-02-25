import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import IncomeSection from '@/Components/system/income/IncomeSection';
import SavingsSection from '@/Components/system/savings/SavingsSection';
import UserStatsCard from '@/Components/system/profile/UserStatsCard';

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
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#3a0f0f] to-transparent flex items-center justify-center text-sm font-semibold text-white ring-1 ring-black/10 dark:ring-black/30"
                         style={{ backgroundImage: `linear-gradient(to bottom right, var(--theme-primary, #3a0f0f), transparent)` }}>
                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                            Perfil
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Gerencie suas informações pessoais, rendas, metas de economia e segurança da conta.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Perfil" />

            <div className="py-4 sm:py-6">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-0 lg:px-2">
                    {/* User Stats */}
                    <UserStatsCard stats={userStats} />

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 rounded-2xl p-6 themed-card">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        <div className="rounded-2xl p-6 themed-card">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>

                    {/* Seção de Rendas */}
                    <div className="rounded-2xl p-6 themed-card">
                        <IncomeSection
                            incomes={incomes}
                            totalMonthlyIncome={totalMonthlyIncome}
                            bankAccounts={bankAccounts}
                            bankAccountsList={bankAccountsList}
                        />
                    </div>

                    {/* Seção de Metas de Economia */}
                    <div className="rounded-2xl p-6 themed-card">
                        <SavingsSection
                            savingsGoals={savingsGoals}
                            savingsSummary={savingsSummary}
                        />
                    </div>

                    <div className="rounded-2xl p-6 themed-card">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
