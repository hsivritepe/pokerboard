'use client';

import { useState } from 'react';
import Link from 'next/link';

type ValidationError = {
    email?: string;
};

export default function ForgotPassword() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [validationError, setValidationError] =
        useState<ValidationError>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (email: string): boolean => {
        const errors: ValidationError = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

        setValidationError(errors);
        return Object.keys(errors).length === 0;
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setValidationError({});

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        if (!validateForm(email)) {
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Something went wrong'
                );
            }

            setSuccess(data.message);
            // In development mode, log the reset link to the console
            if (
                process.env.NODE_ENV === 'development' &&
                data.resetLink
            ) {
                console.log('Reset link:', data.resetLink);
            }
            e.currentTarget.reset();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'An error occurred. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link
                        href="/auth/signin"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        return to sign in
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

                        {success && (
                            <div className="rounded-md bg-green-50 p-4">
                                <div className="text-sm text-green-700">
                                    {success}
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className={`block w-full appearance-none rounded-md border ${
                                        validationError.email
                                            ? 'border-red-300'
                                            : 'border-gray-300'
                                    } px-3 py-2 placeholder-gray-400 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500`}
                                />
                                {validationError.email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {validationError.email}
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
                                    ? 'Sending...'
                                    : 'Send reset instructions'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
