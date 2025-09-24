'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PlayerActions from './PlayerActions';

interface PlayerSession {
    id: string;
    userId: string;
    sessionId: string;
    joinedAt: Date;
    leftAt: Date | null;
    initialBuyIn: number;
    currentStack: number;
    status: 'ACTIVE' | 'CASHED_OUT' | 'BUSTED';
    user: User;
    transactions?: {
        id: string;
        type: string;
        amount: number;
    }[];
}

interface PlayerManagementProps {
    sessionId: string;
    players: PlayerSession[];
    isHost: boolean;
    isAdmin: boolean;
    minimumBuyIn: number;
}

interface UserOption {
    id: string;
    name: string;
    email: string;
}

export default function PlayerManagement({
    sessionId,
    players,
    isHost,
    isAdmin,
    minimumBuyIn,
}: PlayerManagementProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [buyInAmount, setBuyInAmount] = useState(minimumBuyIn);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const canManagePlayers = isHost || isAdmin;

    // Fetch users whenever the add player modal is opened
    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAddingPlayer) {
                setUsers([]); // Clear users when modal is closed
                return;
            }

            setIsLoadingUsers(true);
            setError('');
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();

                // Filter out users who are already in the session
                const playerIds = players.map((p) => p.userId);
                const availableUsers = data.filter(
                    (user: UserOption) => {
                        const isInSession = playerIds.includes(
                            user.id
                        );
                        return !isInSession;
                    }
                );

                setUsers(availableUsers);
            } catch (error) {
                setError('Failed to load users');
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [isAddingPlayer, players]);

    const handleAddPlayer = async () => {
        if (!selectedUserId || buyInAmount < minimumBuyIn) {
            setError(
                `Please select a player and enter a buy-in amount of at least $${minimumBuyIn}`
            );
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/sessions/${sessionId}/players`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: selectedUserId,
                        initialBuyIn: buyInAmount,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.text();
                throw new Error(data);
            }

            // Reset form and refresh data
            setIsAddingPlayer(false);
            setSelectedUserId('');
            setBuyInAmount(minimumBuyIn);
            setUsers([]); // Clear users list
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to add player'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadgeClass = (status: PlayerSession['status']) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800';
            case 'CASHED_OUT':
                return 'bg-blue-100 text-blue-800';
            case 'BUSTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <h2 className="text-lg font-semibold">
                    {t('playerManagement.players')}
                </h2>
                {canManagePlayers && (
                    <button
                        onClick={() => setIsAddingPlayer(true)}
                        className="bg-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded hover:bg-blue-600 transition-colors w-full sm:w-auto"
                        disabled={isAddingPlayer}
                    >
                        {t('playerManagement.addPlayer')}
                    </button>
                )}
            </div>

            {isAddingPlayer && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                    <h3 className="font-medium">
                        {t('playerManagement.addNewPlayer')}
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label
                                htmlFor="userId"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('playerManagement.selectPlayer')}
                            </label>
                            <select
                                id="userId"
                                value={selectedUserId}
                                onChange={(e) =>
                                    setSelectedUserId(e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 text-sm sm:text-base"
                                disabled={isLoadingUsers}
                            >
                                <option value="">
                                    {isLoadingUsers
                                        ? t(
                                              'playerManagement.loadingUsers'
                                          )
                                        : t(
                                              'playerManagement.selectAPlayer'
                                          )}
                                </option>
                                {users.map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="buyIn"
                                className="block text-sm font-medium text-gray-700"
                            >
                                {t('playerManagement.buyInAmount')} (
                                {t('playerManagement.minimum')}: $
                                {minimumBuyIn})
                            </label>
                            <input
                                type="number"
                                id="buyIn"
                                value={buyInAmount}
                                onChange={(e) =>
                                    setBuyInAmount(
                                        Number(e.target.value)
                                    )
                                }
                                min={minimumBuyIn}
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 text-sm sm:text-base"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2">
                            <button
                                onClick={() =>
                                    setIsAddingPlayer(false)
                                }
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                                disabled={isLoading}
                            >
                                {t('playerManagement.cancel')}
                            </button>
                            <button
                                onClick={handleAddPlayer}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? 'Adding...'
                                    : t('playerManagement.addPlayer')}
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile view for players */}
            <div className="sm:hidden space-y-4">
                {players.map((player) => {
                    // Calculate total buy-in from transactions
                    const buyInTransactions =
                        player.transactions?.filter(
                            (t) =>
                                t.type === 'BUY_IN' ||
                                t.type === 'REBUY'
                        ) || [];

                    const totalBuyIn =
                        buyInTransactions.length > 0
                            ? buyInTransactions.reduce(
                                  (sum, t) => sum + t.amount,
                                  0
                              )
                            : player.initialBuyIn;

                    const profitLoss =
                        player.currentStack - totalBuyIn;

                    return (
                        <div
                            key={player.id}
                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {player.user.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {player.user.email}
                                    </div>
                                </div>
                                <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                        player.status
                                    )}`}
                                >
                                    {t(
                                        `playerStatus.${player.status.toLowerCase()}`
                                    )}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">
                                        {t(
                                            'playerManagement.totalBuyIn'
                                        )}
                                        :
                                    </span>
                                    <span className="font-medium ml-1">
                                        ${totalBuyIn.toString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">
                                        {t(
                                            'playerManagement.cashOut'
                                        )}
                                        :
                                    </span>
                                    <span className="font-medium ml-1">
                                        $
                                        {player.currentStack.toString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">
                                        Profit/Loss:
                                    </span>
                                    <span
                                        className={`font-medium ml-1 ${
                                            profitLoss > 0
                                                ? 'text-green-600'
                                                : profitLoss < 0
                                                ? 'text-red-600'
                                                : ''
                                        }`}
                                    >
                                        ${profitLoss.toString()}
                                    </span>
                                </div>

                                {canManagePlayers && (
                                    <div className="col-span-2 mt-2">
                                        <PlayerActions
                                            sessionId={sessionId}
                                            playerId={player.id}
                                            playerName={
                                                player.user.name
                                            }
                                            isActive={
                                                player.status ===
                                                'ACTIVE'
                                            }
                                            currentStack={
                                                player.currentStack
                                            }
                                            minimumBuyIn={
                                                minimumBuyIn
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop/Tablet view for players */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {t('playerManagement.player')}
                            </th>
                            <th
                                scope="col"
                                className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {t('playerManagement.status')}
                            </th>
                            <th
                                scope="col"
                                className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {t('playerManagement.totalBuyIn')}
                            </th>
                            <th
                                scope="col"
                                className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {t('playerManagement.cashOutAmount')}
                            </th>
                            <th
                                scope="col"
                                className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Profit/Loss
                            </th>
                            {canManagePlayers && (
                                <th
                                    scope="col"
                                    className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {t('playerManagement.actions')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {players.map((player) => {
                            // Calculate total buy-in from transactions
                            const buyInTransactions =
                                player.transactions?.filter(
                                    (t) =>
                                        t.type === 'BUY_IN' ||
                                        t.type === 'REBUY'
                                ) || [];

                            const totalBuyIn =
                                buyInTransactions.length > 0
                                    ? buyInTransactions.reduce(
                                          (sum, t) => sum + t.amount,
                                          0
                                      )
                                    : player.initialBuyIn;

                            const profitLoss =
                                player.currentStack - totalBuyIn;

                            return (
                                <tr key={player.id}>
                                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {player.user.name}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">
                                                    {
                                                        player.user
                                                            .email
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                                player.status
                                            )}`}
                                        >
                                            {t(
                                                `playerStatus.${player.status.toLowerCase()}`
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${totalBuyIn.toString()}
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                        $
                                        {player.currentStack.toString()}
                                    </td>
                                    <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={
                                                profitLoss > 0
                                                    ? 'text-green-600'
                                                    : profitLoss < 0
                                                    ? 'text-red-600'
                                                    : 'text-gray-900'
                                            }
                                        >
                                            ${profitLoss.toString()}
                                        </span>
                                    </td>
                                    {canManagePlayers && (
                                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <PlayerActions
                                                sessionId={sessionId}
                                                playerId={player.id}
                                                playerName={
                                                    player.user.name
                                                }
                                                isActive={
                                                    player.status ===
                                                    'ACTIVE'
                                                }
                                                currentStack={
                                                    player.currentStack
                                                }
                                                minimumBuyIn={
                                                    minimumBuyIn
                                                }
                                            />
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
