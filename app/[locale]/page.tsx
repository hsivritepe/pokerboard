'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function Home() {
    const t = useTranslations();
    const pathname = usePathname();

    // Detect current locale from pathname
    const currentLocale = pathname?.split('/')[1] || 'en';

    return (
        <div className="min-h-screen bg-gray-100">
            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {t('home.welcome')}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {t('home.description')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href={`/${currentLocale}/sessions/new`}
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            {t('common.createNewSession')}
                        </h2>
                        <p className="text-gray-600">
                            {t('home.createNewSessionDescription')}
                        </p>
                    </Link>

                    <Link
                        href={`/${currentLocale}/sessions`}
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            {t('common.viewSessions')}
                        </h2>
                        <p className="text-gray-600">
                            {t('home.viewSessionsDescription')}
                        </p>
                    </Link>

                    <Link
                        href={`/${currentLocale}/settlements`}
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            {t('navigation.settlements')}
                        </h2>
                        <p className="text-gray-600">
                            View and manage your poker game
                            settlements
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
