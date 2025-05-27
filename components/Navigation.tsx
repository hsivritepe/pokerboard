'use client';

import { Fragment } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const baseNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Sessions', href: '/sessions' },
    { name: 'Settlements', href: '/settlements' },
];

const adminNavigation = [
    { name: 'Players', href: '/players', adminOnly: true },
];

export function Navigation() {
    const { data: session } = useSession();
    const pathname = usePathname();

    // Combine navigation items based on user role
    const navigation = [
        ...baseNavigation,
        ...(session?.user?.isAdmin ? adminNavigation : []),
    ];

    return (
        <Disclosure as="nav" className="bg-white shadow">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link
                                        href="/"
                                        className="text-xl font-bold text-gray-900"
                                    >
                                        PokerBoard
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={clsx(
                                                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                                                pathname === item.href
                                                    ? 'border-indigo-500 text-gray-900'
                                                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                {session ? (
                                    <Menu
                                        as="div"
                                        className="relative ml-3"
                                    >
                                        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                            <span className="sr-only">
                                                Open user menu
                                            </span>
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                {session.user
                                                    ?.name?.[0] ||
                                                    'U'}
                                            </div>
                                        </Menu.Button>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-200"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() =>
                                                                signOut()
                                                            }
                                                            className={clsx(
                                                                active
                                                                    ? 'bg-gray-100'
                                                                    : '',
                                                                'block w-full px-4 py-2 text-left text-sm text-gray-700'
                                                            )}
                                                        >
                                                            Sign out
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : (
                                    <Link
                                        href="/auth/signin"
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        Sign in
                                    </Link>
                                )}
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                                    <span className="sr-only">
                                        Open main menu
                                    </span>
                                    {open ? (
                                        <XMarkIcon
                                            className="block h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Bars3Icon
                                            className="block h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 pb-3 pt-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as={Link}
                                    href={item.href}
                                    className={clsx(
                                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium',
                                        pathname === item.href
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 pb-3 pt-4">
                            {session ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => signOut()}
                                        className="block w-full px-4 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Disclosure.Button
                                        as={Link}
                                        href="/auth/signin"
                                        className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        Sign in
                                    </Disclosure.Button>
                                </div>
                            )}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
}
