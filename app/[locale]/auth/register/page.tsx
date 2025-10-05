'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type ValidationErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

export default function Register() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations();
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] =
        useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (formData: FormData): boolean => {
        const errors: ValidationErrors = {};
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get(
            'confirmPassword'
        ) as string;

        // Name validation
        if (name.length < 2) {
            errors.name = t('auth.nameRequired');
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = t('auth.pleaseEnterValidEmail');
        }

        // Password validation
        if (password.length < 6) {
            errors.password = t('auth.passwordMinLength');
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            errors.confirmPassword = t('auth.passwordsDoNotMatch');
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

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || 'Registration failed'
                );
            }

            router.push(`/${locale}/auth/signin?registered=true`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t('auth.errorDuringRegistration')
            );
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    {t('auth.createNewAccount')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('auth.or')}{' '}
                    <Link
                        href={`/${locale}/auth/signin`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {t('auth.signInToAccount')}
                    </Link>
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
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('auth.fullName')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className={`block w-full appearance-none rounded-md border ${
                                        validationErrors.name
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                                />
                                {validationErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationErrors.name}
                                    </p>
                                )}
                            </div>
                        </div>

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
                                    autoComplete="new-password"
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
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('auth.confirmPassword')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className={`block w-full appearance-none rounded-md border ${
                                        validationErrors.confirmPassword
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                                />
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {
                                            validationErrors.confirmPassword
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? t('common.creating')
                                    : t('auth.createAccount')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
