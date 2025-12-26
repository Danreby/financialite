import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import FloatLabelField from '@/Components/common/inputs/FloatLabelField';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

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
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
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

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Seu endereço de e-mail ainda não foi verificado.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Clique aqui para reenviar o e-mail de verificação.
                            </Link>
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
