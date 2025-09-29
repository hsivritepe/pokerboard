'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { SessionStatus } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { formatNumber } from '@/lib/utils';
import type {
    User,
    GameSession,
    PlayerSession,
} from '@prisma/client';
import SessionActions from './SessionActions';
import PlayerManagement from './PlayerManagement';
import SessionSettlement from './SessionSettlement';

type UserWithAdmin = User & {
    isAdmin: boolean;
};

type GameSessionWithRelations = GameSession & {
    host: User;
    participants: (PlayerSession & {
        user: User;
        transactions: any[];
    })[];
};

type Props = {
    params: Promise<{ id: string; locale: string }>; // Type params as a Promise
};

export default async function SessionDetailPage({ params }: Props) {
    const { id, locale } = await params; // Await params to resolve the id and locale
    const t = await getTranslations();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect(`/${locale}/auth/signin`);
    }

    const currentUser = (await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, isAdmin: true },
    })) as UserWithAdmin;

    if (!currentUser) {
        redirect(`/${locale}/auth/signin`);
    }

    const gameSession = await prisma.gameSession.findUnique({
        where: { id }, // Use the resolved id
        include: {
            host: true,
            participants: {
                include: {
                    user: true,
                    transactions: true,
                },
                orderBy: {
                    joinedAt: 'desc',
                },
            },
        },
    });

    if (!gameSession) {
        redirect(`/${locale}/sessions`);
    }

    // Check if user has access to this session
    const hasAccess =
        currentUser.isAdmin ||
        gameSession.hostId === currentUser.id ||
        gameSession.participants.some(
            (p) => p.userId === currentUser.id
        );

    if (!hasAccess) {
        redirect(`/${locale}/sessions`);
    }

    // Check if user is host or admin (can manage session)
    const canManageSession =
        currentUser.isAdmin || gameSession.hostId === currentUser.id;

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        {t('sessionDetail.title')}
                    </h1>
                    {canManageSession && (
                        <SessionActions
                            sessionId={id} // Use resolved id
                            currentStatus={gameSession.status}
                            isHost={
                                gameSession.hostId === currentUser.id
                            }
                            isAdmin={currentUser.isAdmin}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-3">
                            {t('sessionDetail.basicInformation')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <span className="font-medium">
                                    {t('common.date')}:
                                </span>{' '}
                                {format(
                                    new Date(gameSession.date),
                                    'PPP'
                                )}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('common.location')}:
                                </span>{' '}
                                {gameSession.location}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('sessionDetail.minimumBuyIn')}:
                                </span>{' '}
                                ₺{formatNumber(gameSession.buyIn)}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('common.host')}:
                                </span>{' '}
                                {gameSession.host.name}
                            </div>
                            <div>
                                <span className="font-medium">
                                    {t('common.status')}:
                                </span>{' '}
                                <span
                                    className={`capitalize px-2 py-1 rounded-full text-xs sm:text-sm inline-block ${
                                        gameSession.status ===
                                        'ONGOING'
                                            ? 'bg-green-100 text-green-800'
                                            : gameSession.status ===
                                              'COMPLETED'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {t(
                                        `status.${gameSession.status.toLowerCase()}`
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <PlayerManagement
                        sessionId={id} // Use resolved id
                        players={gameSession.participants}
                        isHost={gameSession.hostId === currentUser.id}
                        isAdmin={currentUser.isAdmin}
                        minimumBuyIn={gameSession.buyIn}
                    />

                    <SessionSettlement
                        sessionId={id} // Use resolved id
                        players={gameSession.participants}
                        isHost={gameSession.hostId === currentUser.id}
                        isAdmin={currentUser.isAdmin}
                        isCompleted={
                            gameSession.status === 'COMPLETED'
                        }
                    />
                </div>
            </div>
        </div>
    );
}
