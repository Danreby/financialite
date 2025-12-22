import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#3a0f0f] to-transparent flex items-center justify-center text-sm font-semibold text-white ring-1 ring-black/10 dark:ring-black/30">
                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
                            Perfil
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Gerencie suas informações pessoais e segurança da conta.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Perfil" />

            <div className="py-4 sm:py-6">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-0 lg:px-2">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 rounded-2xl bg-white/95 p-6 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        <div className="rounded-2xl bg-white/95 p-6 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/95 p-6 shadow-md ring-1 ring-black/5 dark:bg-[#0b0b0b] dark:ring-black/30">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
