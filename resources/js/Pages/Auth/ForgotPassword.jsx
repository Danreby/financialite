import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthCard from '@/Components/auth/AuthCard';
import FloatLabelField from '@/Components/common/inputs/FloatLabelField';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    const sent = !!status;

    return (
        <GuestLayout>
            <Head title="Recuperar senha" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md mx-auto px-4"
            >
                <AuthCard>
                    <div className="px-6 pt-8 pb-8 sm:px-8 space-y-6">

                        <div className="flex flex-col items-center text-center gap-3">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.35, type: 'spring', stiffness: 200 }}
                                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)] shadow-lg shadow-rose-900/30"
                                aria-hidden="true"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-7 w-7 text-white"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </motion.div>

                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                    Recuperar senha
                                </h1>
                                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                                    Informe seu e-mail e enviaremos um link seguro para você criar uma nova senha.
                                </p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {sent && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span className="mt-0.5 flex-shrink-0 text-emerald-400" aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <p className="text-sm font-medium text-emerald-400 leading-relaxed">
                                        {status}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.form
                            onSubmit={submit}
                            className="space-y-5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            noValidate
                        >
                            <FloatLabelField
                                id="email"
                                name="email"
                                type="email"
                                label="Endereço de e-mail"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                isRequired
                                isDisabled={processing || sent}
                                inputProps={{
                                    autoFocus: true,
                                    autoComplete: 'email',
                                    inputMode: 'email',
                                }}
                            />

                            <PrimaryButton
                                type="submit"
                                className="w-full justify-center"
                                disabled={processing || sent}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Enviando…
                                    </span>
                                ) : sent ? (
                                    'Link enviado ✓'
                                ) : (
                                    'Enviar link de recuperação'
                                )}
                            </PrimaryButton>
                        </motion.form>

                        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Voltar para o login
                            </Link>
                        </div>

                    </div>
                </AuthCard>
            </motion.div>
        </GuestLayout>
    );
}
