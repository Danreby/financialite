import DangerButton from '@/Components/common/buttons/DangerButton';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/common/buttons/SecondaryButton';
import FloatLabelField from '@/Components/common/inputs/FloatLabelField';
import { useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Modal from '@/Components/common/Modal';
import { toast } from 'react-toastify';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const hasPassword = usePage().props.auth?.user?.has_password !== false;
    const field = hasPassword ? 'password' : 'email';

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
        email: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => {
                passwordInput.current.focus();
                toast.error(
                    hasPassword
                        ? 'Erro ao excluir conta. Verifique sua senha.'
                        : 'Erro ao excluir conta. Verifique seu e-mail.'
                );
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    Excluir conta
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Ao excluir sua conta, todos os seus dados serão apagados
                    permanentemente. Faça download de qualquer informação que
                    deseja guardar antes de continuar.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                Excluir conta
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Tem certeza de que deseja excluir sua conta?
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Depois de excluir a conta, todos os recursos e dados
                        serão apagados permanentemente.{' '}
                        {hasPassword
                            ? 'Digite sua senha para confirmar essa ação.'
                            : 'Digite seu e-mail para confirmar essa ação.'}
                    </p>

                    <div className="mt-6 w-3/4">
                        <FloatLabelField
                            id={field}
                            name={field}
                            type={hasPassword ? 'password' : 'email'}
                            label={
                                hasPassword
                                    ? 'Senha'
                                    : 'Digite seu e-mail para confirmar'
                            }
                            ref={passwordInput}
                            value={data[field]}
                            onChange={(e) => setData(field, e.target.value)}
                            error={errors[field]}
                            isRequired
                            inputProps={{ autoFocus: true }}
                        />

                        <InputError
                            message={errors[field]}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            Excluir conta
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
