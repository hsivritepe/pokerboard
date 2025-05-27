'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ValidationErrors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

export default function Register() {
    const router = useRouter();
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
        if (name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters long';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

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

        const formData = new FormData(e.currentTarget);

        if (!validateForm(formData)) {
            return;
        }

        setIsLoading(true);

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Something went wrong'
                );
            }

            router.push('/auth/signin?registered=true');
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'An error occurred during registration'
            );
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link
                        href="/auth/signin"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        sign in to your account
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
                                Full name
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
                                Password
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
                                Confirm password
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
                                    ? 'Creating account...'
                                    : 'Create account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
