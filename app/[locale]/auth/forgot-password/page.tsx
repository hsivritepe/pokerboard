'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ForgotPassword() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError(t('auth.pleaseEnterValidEmail'));
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                '/api/auth/forgot-password',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Failed to send reset email'
                );
            }

            setSuccess(true);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t('auth.errorDuringPasswordReset')
            );
        } finally {
            setIsLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                                {t('auth.emailSent')}
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                {t('auth.checkEmailForReset')}
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={`/${locale}/auth/signin`}
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    {t('auth.backToSignIn')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    {t('auth.forgotPassword')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('auth.enterEmailToReset')}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form
                        className="space-y-6"
                        onSubmit={handleSubmit}
                    >
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="text-sm text-red-700">
                                    {error}
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('auth.emailAddress')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? t('common.sending')
                                    : t('auth.sendResetEmail')}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                href={`/${locale}/auth/signin`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                {t('auth.backToSignIn')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
