'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type ValidationErrors = {
    email?: string;
    password?: string;
};

export default function SignIn() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations();
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] =
        useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] =
        useState(false);

    useEffect(() => {
        try {
            const params = searchParams;
            if (!params) return;

            if (
                params.get('registered') === 'true' ||
                params.get('reset') === 'true'
            ) {
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 5000);
            }
        } catch (error) {
            console.error('Error handling URL parameters:', error);
        }
    }, [searchParams]);

    const validateForm = (formData: FormData): boolean => {
        const errors: ValidationErrors = {};
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = t('auth.pleaseEnterValidEmail');
        }

        // Password validation
        if (password.length < 1) {
            errors.password = t('auth.passwordRequired');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setValidationErrors({});

        const formData = new FormData(e.currentTarget);

        if (!validateForm(formData)) {
            return;
        }

        setIsLoading(true);

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(t('auth.invalidEmailOrPassword'));
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (error) {
            setError(t('auth.errorDuringSignIn'));
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    {t('auth.signInToAccount')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('auth.or')}{' '}
                    <Link
                        href="/en/auth/register"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {t('auth.createNewAccount')}
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {showSuccessMessage && (
                        <div className="rounded-md bg-green-50 p-4 mb-6">
                            <div className="text-sm text-green-700">
                                {searchParams?.get('registered') ===
                                'true'
                                    ? t(
                                          'auth.accountCreatedSuccessfully'
                                      )
                                    : t(
                                          'auth.passwordResetSuccessfully'
                                      )}
                            </div>
                        </div>
                    )}

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
                                    className={`block w-full appearance-none rounded-md border ${
                                        validationErrors.email
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                                />
                                {validationErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationErrors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('common.password')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className={`block w-full appearance-none rounded-md border ${
                                        validationErrors.password
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                                />
                                {validationErrors.password && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationErrors.password}
                                    </p>
                                )}
                            </div>
                            <div className="mt-2 text-right">
                                <Link
                                    href="/en/auth/forgot-password"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    {t('auth.forgotPassword')}
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? t('common.signingIn')
                                    : t('common.signIn')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
