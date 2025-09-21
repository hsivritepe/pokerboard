'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Player {
    userId: string;
    initialBuyIn: number;
}

interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

export default function CreateGameSession({
    users,
}: {
    users: User[];
}) {
    const router = useRouter();
    const t = useTranslations();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [minBuyIn, setMinBuyIn] = useState<number>(1000);
    const [buyInAmount, setBuyInAmount] = useState<string>(
        minBuyIn.toString()
    );

    // Update buy-in amount when minimum buy-in changes
    const handleMinBuyInChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseFloat(e.target.value);
        setMinBuyIn(value);
        setBuyInAmount(value.toString());
    };

    const addPlayer = () => {
        if (!selectedUserId || !buyInAmount) {
            setError(t('session.pleaseSelectPlayerAndEnterBuyIn'));
            return;
        }

        const amount = parseFloat(buyInAmount);
        if (isNaN(amount) || amount < minBuyIn) {
            setError(
                t('session.buyInAmountMustBeAtLeast', { minBuyIn })
            );
            return;
        }

        // Check if player is already added
        if (players.some((p) => p.userId === selectedUserId)) {
            setError(t('session.playerAlreadyAdded'));
            return;
        }

        setPlayers([
            ...players,
            { userId: selectedUserId, initialBuyIn: amount },
        ]);
        setSelectedUserId('');
        setBuyInAmount(minBuyIn.toString());
        setError(null);
    };

    const removePlayer = (userId: string) => {
        setPlayers(players.filter((p) => p.userId !== userId));
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const date = formData.get('date') as string;
        const location = formData.get('location') as string;
        const buyIn = parseFloat(formData.get('minBuyIn') as string);

        if (!date || !buyIn || players.length === 0) {
            setError(t('session.pleaseFillAllRequiredFields'));
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date,
                    location,
                    buyIn,
                    players: players.map((p) => ({
                        userId: p.userId,
                        buyIn: p.initialBuyIn,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        t('session.failedToCreateGameSession')
                );
            }

            router.push('/sessions');
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : t('session.anErrorOccurred')
            );
        } finally {
            setIsLoading(false);
        }
    };

    const getUserName = (userId: string) => {
        return (
            users.find((u) => u.id === userId)?.name ||
            t('common.unknownUser')
        );
    };

    return (
        <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">
                {t('session.createNewGameSession')}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {t('session.dateAndTime')}
                    </label>
                    <input
                        type="datetime-local"
                        id="date"
                        name="date"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {t('common.location')}
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="minBuyIn"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {t('common.minimumBuyInAmount')}
                    </label>
                    <input
                        type="number"
                        id="minBuyIn"
                        name="minBuyIn"
                        min="0"
                        step="0.01"
                        required
                        value={minBuyIn}
                        onChange={handleMinBuyInChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium mb-4">
                        {t('session.addPlayers')}
                    </h3>

                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedUserId}
                            onChange={(e) =>
                                setSelectedUserId(e.target.value)
                            }
                            className="flex-1 rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                        >
                            <option value="">
                                {t('common.selectPlayer')}
                            </option>
                            {users
                                .filter(
                                    (user) =>
                                        !players.some(
                                            (p) =>
                                                p.userId === user.id
                                        )
                                )
                                .map((user) => (
                                    <option
                                        key={user.id}
                                        value={user.id}
                                    >
                                        {user.name}
                                    </option>
                                ))}
                        </select>
                        <input
                            type="number"
                            value={buyInAmount}
                            onChange={(e) =>
                                setBuyInAmount(e.target.value)
                            }
                            placeholder={t('common.buyInAmount')}
                            min={minBuyIn}
                            step="0.01"
                            className="w-32 rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                        />
                        <button
                            type="button"
                            onClick={addPlayer}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            {t('common.add')}
                        </button>
                    </div>

                    {players.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">
                                {t('common.addedPlayers')}
                            </h4>
                            <ul className="space-y-2">
                                {players.map((player) => (
                                    <li
                                        key={player.userId}
                                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                        <span>
                                            {getUserName(
                                                player.userId
                                            )}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-600">
                                                ${player.initialBuyIn}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePlayer(
                                                        player.userId
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                {t('common.remove')}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading || players.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading
                            ? t('common.creating')
                            : t('session.createGameSession')}
                    </button>
                </div>
            </form>
        </div>
    );
}
