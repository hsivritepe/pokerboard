'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ValidationErrors = {
    password?: string;
    confirmPassword?: string;
};

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] =
        useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(
        null
    );

    useEffect(() => {
        const token = searchParams?.get('token');
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }
        setToken(token);
        validateToken(token);
    }, [searchParams]);

    async function validateToken(token: string) {
        try {
            const response = await fetch(
                `/api/auth/verify-reset-token?token=${token}`
            );
            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message || 'Invalid or expired reset token'
                );
                setIsTokenValid(false);
                return;
            }

            setIsTokenValid(true);
        } catch (error) {
            setError(
                'An error occurred while validating the reset token'
            );
            setIsTokenValid(false);
        }
    }

    const validateForm = (formData: FormData): boolean => {
        const errors: ValidationErrors = {};
        const password = formData.get('password') as string;
        const confirmPassword = formData.get(
            'confirmPassword'
        ) as string;

        // Password validation
        if (password.length < 8) {
            errors.password =
                'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(password)) {
            errors.password =
                'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(password)) {
            errors.password =
                'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(password)) {
            errors.password =
                'Password must contain at least one number';
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setValidationErrors({});

        if (!token || !isTokenValid) {
            setError('Invalid or expired reset token');
            return;
        }

        const formData = new FormData(e.currentTarget);

        if (!validateForm(formData)) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password: formData.get('password'),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Something went wrong'
                );
            }

            router.push('/auth/signin?reset=true');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'An error occurred. Please try again.'
            );
            setIsLoading(false);
        }
    }

    if (isTokenValid === false) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Invalid Reset Link
                            </h2>
                            <p className="text-gray-600 mb-6">
                                This password reset link is invalid or
                                has expired.
                            </p>
                            <Link
                                href="/auth/forgot-password"
                                className="text-indigo-600 hover:text-indigo-500"
                            >
                                Request a new reset link
                            </Link>
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
                    Reset your password
                </h2>
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
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                New password
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
                                {validationErrors.password ? (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationErrors.password}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-700">
                                        Must be at least 8 characters
                                        with 1 uppercase, 1 lowercase,
                                        and 1 number
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Confirm new password
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
                                disabled={isLoading || !isTokenValid}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? 'Resetting password...'
                                    : 'Reset password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
