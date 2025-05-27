'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/components/ui/select';
import { cn } from '@/lib/utils';
import { use } from 'react';

interface PlayerSession {
    id: string;
    initialBuyIn: number;
    currentStack: number;
    joinedAt: string;
    session: {
        id: string;
        date: string;
        gameType: string;
        location: string;
        status: string;
    };
    transactions: {
        id: string;
        amount: number;
        type: string;
        createdAt: string;
    }[];
}

interface Player {
    id: string;
    name: string | null;
    email: string | null;
    isDeleted: boolean;
    playerSessions: PlayerSession[];
}

interface PageParams {
    id: string;
}

export default function PlayerDetailPage({
    params,
}: {
    params: Promise<PageParams>;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const resolvedParams = use(params) as PageParams;
    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<string>('all');
    const [gameFilter, setGameFilter] = useState<string>('all');
    const [filteredSessions, setFilteredSessions] = useState<
        PlayerSession[]
    >([]);

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                const response = await fetch(
                    `/api/users/${resolvedParams.id}`
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch player');
                }
                const data = await response.json();
                setPlayer(data);
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

        fetchPlayer();
    }, [resolvedParams.id]);

    useEffect(() => {
        if (!player) return;

        let sessions = [...player.playerSessions];

        // Apply time filter
        if (timeFilter !== 'all') {
            const months = parseInt(timeFilter);
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - months);
            sessions = sessions.filter(
                (s) => new Date(s.session.date) >= cutoffDate
            );
        }

        // Apply game filter
        if (gameFilter !== 'all') {
            sessions = sessions.filter(
                (s) => s.session.gameType === gameFilter
            );
        }

        setFilteredSessions(sessions);
    }, [player, timeFilter, gameFilter]);

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

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (!player) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    Player not found
                </div>
            </div>
        );
    }

    const totalBuyIns = filteredSessions.reduce(
        (sum, session) => sum + session.initialBuyIn,
        0
    );
    const totalCashouts = filteredSessions.reduce(
        (sum, session) => sum + session.currentStack,
        0
    );
    const netProfit = totalCashouts - totalBuyIns;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    Back to Players
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {player.name}
                    </h1>
                    <p className="text-gray-600">{player.email}</p>
                    {player.isDeleted && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Deleted
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Total Games
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                {filteredSessions.length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Total Buy-ins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-gray-900">
                                ${totalBuyIns}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Net Profit/Loss
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p
                                className={cn(
                                    'text-2xl font-bold',
                                    netProfit >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                )}
                            >
                                {netProfit >= 0 ? '+' : ''}$
                                {netProfit}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Session History
                    </h2>
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative z-50">
                            <Select
                                value={timeFilter}
                                onValueChange={setTimeFilter}
                            >
                                <SelectTrigger className="w-[180px] bg-white text-gray-900">
                                    <SelectValue placeholder="Time Period" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-gray-900">
                                    <SelectItem key="all" value="all">
                                        All Time
                                    </SelectItem>
                                    <SelectItem key="1" value="1">
                                        Last Month
                                    </SelectItem>
                                    <SelectItem key="2" value="2">
                                        Last 2 Months
                                    </SelectItem>
                                    <SelectItem key="3" value="3">
                                        Last 3 Months
                                    </SelectItem>
                                    <SelectItem key="6" value="6">
                                        Last 6 Months
                                    </SelectItem>
                                    <SelectItem key="12" value="12">
                                        Last Year
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative z-50">
                            <Select
                                value={gameFilter}
                                onValueChange={setGameFilter}
                            >
                                <SelectTrigger className="w-[180px] bg-white text-gray-900">
                                    <SelectValue placeholder="Select Game" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-gray-900">
                                    <SelectItem
                                        key="all-games"
                                        value="all"
                                    >
                                        All Games
                                    </SelectItem>
                                    {(() => {
                                        console.log(
                                            'Player Sessions:',
                                            player.playerSessions
                                        );
                                        const gameTypes = Array.from(
                                            new Set(
                                                player.playerSessions
                                                    .filter((s) => {
                                                        console.log(
                                                            'Session:',
                                                            s
                                                        );
                                                        console.log(
                                                            'Game Type:',
                                                            s.session
                                                                .gameType
                                                        );
                                                        return s
                                                            .session
                                                            .gameType;
                                                    })
                                                    .map(
                                                        (s) =>
                                                            s.session
                                                                .gameType
                                                    )
                                                    .sort()
                                            )
                                        );
                                        console.log(
                                            'Unique Game Types:',
                                            gameTypes
                                        );
                                        return gameTypes.map(
                                            (gameType) => (
                                                <SelectItem
                                                    key={`game-${gameType
                                                        .replace(
                                                            /\s+/g,
                                                            '-'
                                                        )
                                                        .toLowerCase()}`}
                                                    value={gameType}
                                                >
                                                    {gameType}
                                                </SelectItem>
                                            )
                                        );
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Location
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Buy-in
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Cashout
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Net
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSessions.map((session) => {
                                    const sessionNet =
                                        session.currentStack -
                                        session.initialBuyIn;
                                    return (
                                        <tr
                                            key={session.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(
                                                    new Date(
                                                        session.session.date
                                                    ),
                                                    'PPP'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {
                                                    session.session
                                                        .location
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                $
                                                {session.initialBuyIn}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                $
                                                {session.currentStack}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={
                                                        sessionNet >=
                                                        0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }
                                                >
                                                    {sessionNet >= 0
                                                        ? '+'
                                                        : ''}
                                                    ${sessionNet}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        session
                                                            .session
                                                            .status ===
                                                        'ONGOING'
                                                            ? 'bg-green-100 text-green-800'
                                                            : session
                                                                  .session
                                                                  .status ===
                                                              'COMPLETED'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {session.session.status.toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/sessions/${session.session.id}/players/${session.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Totals Row */}
                                <tr
                                    key="totals"
                                    className="bg-gray-50 font-medium"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Totals
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${totalBuyIns}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${totalCashouts}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={
                                                netProfit >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }
                                        >
                                            {netProfit >= 0
                                                ? '+'
                                                : ''}
                                            ${netProfit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
