'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

type Props = {
    params: Promise<{ locale: string }>;
};

export default function SessionsPage({ params }: Props) {
    const { locale } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session?.user) {
            router.push(`/${locale}/auth/signin`);
            return;
        }

        // Fetch sessions
        const fetchSessions = async () => {
            try {
                const response = await fetch('/api/sessions');
                if (response.ok) {
                    const allSessions = await response.json();

                    // Filter sessions based on user role (admin can see all, others see only their sessions)
                    const filteredSessions = allSessions.filter(
                        (sessionItem: any) => {
                            // Check if user is host
                            if (
                                sessionItem.host?.email ===
                                session?.user?.email
                            ) {
                                return true;
                            }

                            // Check if user is a participant
                            return sessionItem.participants?.some(
                                (participant: any) =>
                                    participant.user?.email ===
                                    session?.user?.email
                            );
                        }
                    );

                    setSessions(filteredSessions);
                }
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [session, status, router, locale]);

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('common.gameSessions')}
                    </h1>
                    <Link
                        href={`/${locale}/sessions/new`}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        {t('common.createNewSession')}
                    </Link>
                </div>

                {sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">
                            {t('common.noSessionsFound')}
                        </p>
                        <Link
                            href={`/${locale}/sessions/new`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {t('common.createFirstSession')}
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {sessions.map((sessionItem) => (
                                <li key={sessionItem.id}>
                                    <Link
                                        href={`/${locale}/sessions/${sessionItem.id}`}
                                        className="block hover:bg-gray-50"
                                    >
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium text-indigo-600 truncate">
                                                        {sessionItem.location ||
                                                            t(
                                                                'common.noLocationSpecified'
                                                            )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-600">
                                                        {t(
                                                            'common.hostedBy'
                                                        )}{' '}
                                                        {sessionItem
                                                            .host
                                                            ?.name ||
                                                            t(
                                                                'common.unknownUser'
                                                            )}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm text-gray-900">
                                                        {format(
                                                            new Date(
                                                                sessionItem.date
                                                            ),
                                                            'PPP p'
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-600">
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                sessionItem.date
                                                            ),
                                                            {
                                                                addSuffix:
                                                                    true,
                                                            }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-700">
                                                        {sessionItem
                                                            .participants
                                                            ?.length ||
                                                            0}{' '}
                                                        {t(
                                                            'common.players'
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                                                    <p>
                                                        {t(
                                                            'common.minBuyIn'
                                                        )}
                                                        : $
                                                        {
                                                            sessionItem.buyIn
                                                        }
                                                    </p>
                                                    <span className="mx-2">
                                                        •
                                                    </span>
                                                    <p
                                                        className={`${
                                                            sessionItem.status ===
                                                            'ONGOING'
                                                                ? 'text-green-600'
                                                                : sessionItem.status ===
                                                                  'COMPLETED'
                                                                ? 'text-blue-600'
                                                                : 'text-gray-600'
                                                        }`}
                                                    >
                                                        {t(
                                                            `status.${sessionItem.status.toLowerCase()}`
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
