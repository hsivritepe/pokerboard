'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/app/components/ui/card';
import PlayerActions from './PlayerActions';
import { use } from 'react';
import { useTranslations } from 'next-intl';

interface Transaction {
    id: string;
    amount: number;
    type: string;
    createdAt: string;
    note?: string;
}

interface PlayerSession {
    id: string;
    joinedAt: string;
    leftAt?: string;
    initialBuyIn: number;
    currentStack: number;
    status: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    session: {
        id: string;
        date: string;
        location: string;
        status: string;
        hostId: string;
        gameType: string;
        buyIn: number;
        host: {
            name: string;
        };
        participants: {
            id: string;
            initialBuyIn: number;
            currentStack: number;
            status: string;
            user: {
                name: string;
            };
        }[];
    };
    transactions: Transaction[];
}

interface Params {
    id: string;
    playerId: string;
}

interface Props {
    params: Promise<Params>;
}

export default function PlayerDetailPage({ params }: Props) {
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations();
    const [playerSession, setPlayerSession] =
        useState<PlayerSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const resolvedParams = use(params) as Params;

    useEffect(() => {
        const fetchPlayerSession = async () => {
            try {
                const response = await fetch(
                    `/api/sessions/${resolvedParams.id}/players/${resolvedParams.playerId}`
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch player session');
                }
                const data = await response.json();
                setPlayerSession(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'An error occurred'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerSession();
    }, [resolvedParams.id, resolvedParams.playerId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !playerSession) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'Player session not found'}
                </div>
            </div>
        );
    }

    const buyInTransactions = playerSession.transactions.filter(
        (t) => t.type === 'BUY_IN' || t.type === 'REBUY'
    );

    const totalBuyIn = buyInTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );

    const netProfit = playerSession.currentStack - totalBuyIn;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    Back to Session
                </Button>
            </div>

            <div className="space-y-8">
                {/* Game Details Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Game Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <span className="text-gray-700">
                                Date:
                            </span>{' '}
                            <span className="font-medium text-gray-900">
                                {format(
                                    new Date(
                                        playerSession.session.date
                                    ),
                                    'PPP'
                                )}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-700">
                                Location:
                            </span>{' '}
                            <span className="font-medium text-gray-900">
                                {playerSession.session.location}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-700">
                                Game Type:
                            </span>{' '}
                            <span className="font-medium text-gray-900">
                                {playerSession.session.gameType ||
                                    "No Limit Hold'em"}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-700">
                                Buy-in:
                            </span>{' '}
                            <span className="font-medium text-gray-900">
                                ₺{playerSession.session.buyIn}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-700">
                                Host:
                            </span>{' '}
                            <span className="font-medium text-gray-900">
                                {playerSession.session.host?.name}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-700">
                                Status:
                            </span>{' '}
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    playerSession.session.status ===
                                    'ONGOING'
                                        ? 'bg-green-100 text-green-800'
                                        : playerSession.session
                                              .status === 'COMPLETED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {playerSession.session.status.toLowerCase()}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative bg-white z-0">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50"
                                    >
                                        Player
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50"
                                    >
                                        Buy-in
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50"
                                    >
                                        Current Stack
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50"
                                    >
                                        Net
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50"
                                    >
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {playerSession.session.participants.map(
                                    (participant) => {
                                        const participantNet =
                                            participant.currentStack -
                                            participant.initialBuyIn;
                                        return (
                                            <tr
                                                key={participant.id}
                                                className={`${
                                                    participant.id ===
                                                    playerSession.id
                                                        ? 'bg-blue-50'
                                                        : ''
                                                } hover:bg-gray-50 transition-colors`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {
                                                        participant
                                                            .user.name
                                                    }
                                                    {participant.id ===
                                                        playerSession.id &&
                                                        ' (You)'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    $
                                                    {
                                                        participant.initialBuyIn
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    $
                                                    {
                                                        participant.currentStack
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span
                                                        className={
                                                            participantNet >=
                                                            0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }
                                                    >
                                                        {participantNet >=
                                                        0
                                                            ? '+'
                                                            : ''}{' '}
                                                        $
                                                        {Math.abs(
                                                            participantNet
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            participant.status ===
                                                            'ACTIVE'
                                                                ? 'bg-green-100 text-green-800'
                                                                : participant.status ===
                                                                  'CASHED_OUT'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {participant.status
                                                            .toLowerCase()
                                                            .replace(
                                                                '_',
                                                                ' '
                                                            )}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Player Details Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {playerSession.user.name}
                            </h1>
                            <p className="text-gray-600">
                                Session Date:{' '}
                                {format(
                                    new Date(
                                        playerSession.session.date
                                    ),
                                    'PPP'
                                )}
                            </p>
                        </div>
                        {session?.user?.email && (
                            <PlayerActions
                                sessionId={resolvedParams.id}
                                playerId={resolvedParams.playerId}
                                playerStatus={playerSession.status}
                                isHost={
                                    playerSession.session.hostId ===
                                    session.user.email
                                }
                                isAdmin={true}
                                isSelf={
                                    playerSession.user.email ===
                                    session.user.email
                                }
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-gray-900">
                                    Player Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">
                                            Initial Buy-in
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            $
                                            {
                                                playerSession.initialBuyIn
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">
                                            Total Buy-in
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            ₺{totalBuyIn}
                                        </span>
                                    </div>
                                    {playerSession.status ===
                                        'CASHED_OUT' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">
                                                End Stack
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                $
                                                {
                                                    playerSession.currentStack
                                                }
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">
                                            {t(
                                                'profitLoss.netProfitLoss'
                                            )}
                                        </span>
                                        {playerSession.status ===
                                        'CASHED_OUT' ? (
                                            <span
                                                className={
                                                    netProfit >= 0
                                                        ? 'text-green-600 font-medium'
                                                        : 'text-red-600 font-medium'
                                                }
                                            >
                                                {netProfit >= 0
                                                    ? '+'
                                                    : ''}{' '}
                                                ₺{Math.abs(netProfit)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-700 italic">
                                                In Game
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">
                                            Status
                                        </span>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                playerSession.status ===
                                                'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : playerSession.status ===
                                                      'CASHED_OUT'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {playerSession.status
                                                .replace('_', ' ')
                                                .toLowerCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">
                                            Joined At
                                        </span>
                                        <span className="font-medium text-gray-900">
                                            {format(
                                                new Date(
                                                    playerSession.joinedAt
                                                ),
                                                'PPp'
                                            )}
                                        </span>
                                    </div>
                                    {playerSession.leftAt && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">
                                                Left At
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {format(
                                                    new Date(
                                                        playerSession.leftAt
                                                    ),
                                                    'PPp'
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-gray-900">
                                    Transaction History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {playerSession.transactions.map(
                                        (transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 capitalize">
                                                        {transaction.type
                                                            .toLowerCase()
                                                            .replace(
                                                                '_',
                                                                ' '
                                                            )}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        {format(
                                                            new Date(
                                                                transaction.createdAt
                                                            ),
                                                            'PPp'
                                                        )}
                                                    </p>
                                                    {transaction.note && (
                                                        <p className="text-sm text-gray-700 mt-1">
                                                            Note:{' '}
                                                            {
                                                                transaction.note
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-medium ${
                                                            transaction.type ===
                                                            'CASH_OUT'
                                                                ? 'text-green-600'
                                                                : transaction.type ===
                                                                      'BUY_IN' ||
                                                                  transaction.type ===
                                                                      'REBUY'
                                                                ? 'text-red-600'
                                                                : 'text-gray-900'
                                                        }`}
                                                    >
                                                        {transaction.type ===
                                                        'CASH_OUT'
                                                            ? '+'
                                                            : '-'}{' '}
                                                        $
                                                        {
                                                            transaction.amount
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
