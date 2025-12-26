import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import FloatLabelField from '@/Components/common/inputs/FloatLabelField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit}>
                <div className="space-y-4">
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
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <FloatLabelField
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            isRequired
                            inputProps={{ autoComplete: 'new-password', autoFocus: true }}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <FloatLabelField
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            label="Confirm Password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            error={errors.password_confirmation}
                            isRequired
                            inputProps={{ autoComplete: 'new-password' }}
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        Reset Password
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
