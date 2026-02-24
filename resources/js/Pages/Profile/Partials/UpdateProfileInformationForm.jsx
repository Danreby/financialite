import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import FloatLabelField from '@/Components/common/inputs/FloatLabelField';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { toast } from 'react-toastify';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            onSuccess: () => {
                toast.success('Perfil atualizado com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar perfil. Verifique os dados.');
            },
        });
    };

    const resendVerification = (e) => {
        e.preventDefault();
        
        router.post(route('verification.send'), {}, {
            onSuccess: () => {
                toast.success('E-mail de verificação enviado!');
            },
            onError: () => {
                toast.error('Erro ao enviar e-mail de verificação.');
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Informações do perfil
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Atualize o nome e o e-mail usados na sua conta.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <FloatLabelField
                        id="name"
                        name="name"
                        type="text"
                        label="Name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        isRequired
                        inputProps={{ autoComplete: 'name', autoFocus: true }}
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <FloatLabelField
                        id="email"
                        name="email"
                        type="email"
                        label="Email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        isRequired
                        inputProps={{ autoComplete: 'username' }}
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <FloatLabelField
                        id="phone"
                        name="phone"
                        type="tel"
                        label="Telefone (opcional)"
                        value={data.phone}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                            let formatted = raw;
                            if (raw.length > 6) {
                                formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
                            } else if (raw.length > 2) {
                                formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
                            } else if (raw.length > 0) {
                                formatted = `(${raw}`;
                            }
                            setData('phone', formatted);
                        }}
                        error={errors.phone}
                        inputProps={{ autoComplete: 'tel' }}
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Seu endereço de e-mail ainda não foi verificado.
                            <button
                                type="button"
                                onClick={resendVerification}
                                className="ml-1 rounded-md text-sm text-theme-accent underline hover:text-theme-accent-hover dark:text-theme-accent dark:hover:text-theme-accent-hover focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2"
                            >
                                Clique aqui para reenviar o e-mail de verificação.
                            </button>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-emerald-500">
                                Um novo link de verificação foi enviado para seu e-mail.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Salvo.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
