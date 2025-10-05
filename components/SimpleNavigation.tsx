'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
    Bars3Icon,
    XMarkIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { ThemeToggle } from './ThemeToggle';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export function SimpleNavigation() {
    const t = useTranslations();
    const pathname = usePathname();
    const { data: session } = useSession();

    // Detect current locale from pathname
    const currentLocale = pathname?.split('/')[1] || 'en';
    const isLocaleRoute = languages.some(
        (lang) => lang.code === currentLocale
    );

    // Navigation items - use locale-aware URLs
    const navigation = [
        {
            name: t('navigation.home'),
            href: isLocaleRoute ? `/${currentLocale}` : '/en',
        },
        {
            name: t('navigation.sessions'),
            href: isLocaleRoute
                ? `/${currentLocale}/sessions`
                : '/en/sessions',
        },
        {
            name: t('navigation.settlements'),
            href: isLocaleRoute
                ? `/${currentLocale}/settlements`
                : '/en/settlements',
        },
    ];

    // Add admin navigation if user is admin
    if (session?.user?.isAdmin) {
        navigation.push({
            name: t('navigation.players'),
            href: isLocaleRoute
                ? `/${currentLocale}/players`
                : '/en/players',
        });
    }

    const changeLanguage = (newLocale: string) => {
        // Remove the current locale from the pathname
        const pathWithoutLocale =
            pathname?.replace(`/${currentLocale}`, '') || '/';
        // Navigate to the new locale
        window.location.href = `/${newLocale}${pathWithoutLocale}`;
    };

    return (
        <Disclosure as="nav" className="bg-white shadow">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link
                                        href={
                                            isLocaleRoute
                                                ? `/${currentLocale}`
                                                : '/en'
                                        }
                                        className="text-xl font-bold text-gray-900"
                                    >
                                        {t('navigation.pokerBoard')}
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={clsx(
                                                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                                                pathname ===
                                                    item.href ||
                                                    (item.name ===
                                                        t(
                                                            'navigation.home'
                                                        ) &&
                                                        (pathname ===
                                                            '/en' ||
                                                            pathname ===
                                                                '/'))
                                                    ? 'border-indigo-500 text-gray-900'
                                                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                                {/* Theme Toggle */}
                                <ThemeToggle />

                                {/* Language Switcher */}
                                <Menu as="div" className="relative">
                                    <Menu.Button className="flex items-center rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                        <GlobeAltIcon className="h-5 w-5 text-gray-600" />
                                        <span className="ml-1 text-gray-600">
                                            {
                                                languages.find(
                                                    (lang) =>
                                                        lang.code ===
                                                        currentLocale
                                                )?.flag
                                            }
                                        </span>
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
                                            {languages.map(
                                                (language) => (
                                                    <Menu.Item
                                                        key={
                                                            language.code
                                                        }
                                                    >
                                                        {({
                                                            active,
                                                        }) => (
                                                            <button
                                                                onClick={() =>
                                                                    changeLanguage(
                                                                        language.code
                                                                    )
                                                                }
                                                                className={clsx(
                                                                    active
                                                                        ? 'bg-gray-100'
                                                                        : '',
                                                                    'flex w-full items-center px-4 py-2 text-sm text-gray-700',
                                                                    currentLocale ===
                                                                        language.code
                                                                        ? 'bg-indigo-50 text-indigo-700'
                                                                        : ''
                                                                )}
                                                            >
                                                                <span className="mr-2">
                                                                    {
                                                                        language.flag
                                                                    }
                                                                </span>
                                                                {
                                                                    language.name
                                                                }
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                )
                                            )}
                                        </Menu.Items>
                                    </Transition>
                                </Menu>

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
                                                            {t(
                                                                'navigation.signOut'
                                                            )}
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                ) : (
                                    <Link
                                        href={
                                            isLocaleRoute
                                                ? `/${currentLocale}/auth/signin`
                                                : '/en/auth/signin'
                                        }
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        {t('navigation.signIn')}
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
                                        pathname === item.href ||
                                            (item.name ===
                                                t(
                                                    'navigation.home'
                                                ) &&
                                                (pathname === '/en' ||
                                                    pathname === '/'))
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 pb-3 pt-4">
                            {/* Mobile Theme Toggle */}
                            <div className="px-4 py-2">
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    {t('navigation.theme')}
                                </p>
                                <div className="flex justify-center">
                                    <ThemeToggle />
                                </div>
                            </div>

                            {/* Mobile Language Switcher */}
                            <div className="px-4 py-2">
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    {t('navigation.language')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {languages.map((language) => (
                                        <button
                                            key={language.code}
                                            onClick={() =>
                                                changeLanguage(
                                                    language.code
                                                )
                                            }
                                            className={clsx(
                                                'flex items-center px-3 py-1 rounded-md text-sm',
                                                currentLocale ===
                                                    language.code
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            )}
                                        >
                                            <span className="mr-1">
                                                {language.flag}
                                            </span>
                                            {language.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {session ? (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => signOut()}
                                        className="block w-full px-4 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        {t('navigation.signOut')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Disclosure.Button
                                        as={Link}
                                        href={
                                            isLocaleRoute
                                                ? `/${currentLocale}/auth/signin`
                                                : '/en/auth/signin'
                                        }
                                        className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        {t('navigation.signIn')}
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
