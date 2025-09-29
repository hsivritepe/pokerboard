'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { formatNumber } from '@/lib/utils';

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
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    // Helper function to format date for Turkish locale (dd.mm.yyyy)
    const formatDateForInput = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1)
            .toString()
            .padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper function to get current date/time in Turkish format
    const getCurrentDateTime = (): string => {
        const now = new Date();
        return formatDateForInput(now);
    };

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        []
    );
    const [minBuyIn, setMinBuyIn] = useState<number>(() => {
        // Get the stored minimum buy-in from localStorage, default to 1000
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('minBuyIn');
            return stored ? parseFloat(stored) : 1000;
        }
        return 1000;
    });
    const [bulkBuyInAmount, setBulkBuyInAmount] = useState<string>(
        minBuyIn.toString()
    );
    const [selectedDateTime, setSelectedDateTime] =
        useState<string>('');

    // Helper function to format date for display in Turkish format
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1)
            .toString()
            .padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year}, ${hours}:${minutes}`;
    };

    // Update bulk buy-in amount when minBuyIn changes (including on mount)
    useEffect(() => {
        setBulkBuyInAmount(minBuyIn.toString());
    }, [minBuyIn]);

    // Set initial date/time on client side to avoid hydration mismatch
    useEffect(() => {
        if (!selectedDateTime) {
            setSelectedDateTime(getCurrentDateTime());
        }
    }, [selectedDateTime]);

    // Update buy-in amount when minimum buy-in changes
    const handleMinBuyInChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseFloat(e.target.value);
        setMinBuyIn(value);
        setBulkBuyInAmount(value.toString());

        // Store the value in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('minBuyIn', value.toString());
        }
    };

    const handlePlayerSelection = (
        userId: string,
        isSelected: boolean
    ) => {
        if (isSelected) {
            setSelectedUserIds([...selectedUserIds, userId]);
        } else {
            setSelectedUserIds(
                selectedUserIds.filter((id) => id !== userId)
            );
        }
    };

    const addSelectedPlayers = () => {
        if (selectedUserIds.length === 0) {
            setError(t('session.pleaseSelectAtLeastOnePlayer'));
            return;
        }

        const amount = parseFloat(bulkBuyInAmount);
        if (isNaN(amount) || amount < minBuyIn) {
            setError(
                t('session.buyInAmountMustBeAtLeast', { minBuyIn })
            );
            return;
        }

        // Add all selected players with the same buy-in amount
        const newPlayers = selectedUserIds.map((userId) => ({
            userId,
            initialBuyIn: amount,
        }));

        setPlayers([...players, ...newPlayers]);
        setSelectedUserIds([]);
        setBulkBuyInAmount(minBuyIn.toString());
        setError(null);
    };

    const selectAllPlayers = () => {
        const availableUserIds = users
            .filter(
                (user) => !players.some((p) => p.userId === user.id)
            )
            .map((user) => user.id);
        setSelectedUserIds(availableUserIds);
    };

    const clearSelection = () => {
        setSelectedUserIds([]);
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

            router.push(`/${locale}/sessions`);
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
                    <div
                        className="mt-1 cursor-pointer"
                        onClick={() => {
                            const dateInput = document.getElementById(
                                'date'
                            ) as HTMLInputElement;
                            if (dateInput) {
                                dateInput.focus();
                                dateInput.showPicker?.();
                            }
                        }}
                    >
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            required
                            value={selectedDateTime}
                            onChange={(e) =>
                                setSelectedDateTime(e.target.value)
                            }
                            lang="tr" // Add this to set the calendar language to Turkish
                            className="block w-full rounded-md border border-gray-300 shadow-sm p-2 text-gray-900 cursor-pointer"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {t('common.location')}
                    </label>
                    <select
                        id="location"
                        name="location"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                    >
                        <option value="">
                            {t('common.selectLocation')}
                        </option>
                        <option value="Allsancak Tontiş Bar">
                            Allsancak Tontiş Bar
                        </option>
                        <option value="Can'ın Lokali">
                            Can'ın Lokali
                        </option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="minBuyIn"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {t('common.minimumBuyInAmount')}
                    </label>
                    <div className="mt-1 relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm font-normal z-10">
                            ₺
                        </span>
                        <input
                            type="number"
                            id="minBuyIn"
                            name="minBuyIn"
                            min="0"
                            step="0.01"
                            required
                            value={minBuyIn}
                            onChange={handleMinBuyInChange}
                            className="block w-full rounded-md border border-gray-300 shadow-sm p-2 pl-10 text-gray-900"
                        />
                        <div className="mt-1 text-sm text-gray-600">
                            {t('common.currentValue')}: ₺
                            {formatNumber(minBuyIn)}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium mb-4">
                        {t('session.addPlayers')}
                    </h3>

                    {/* Bulk Selection Controls */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                                {t('session.selectPlayers')} (
                                {selectedUserIds.length} selected)
                            </h4>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllPlayers}
                                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    {t('session.selectAllAvailable')}
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    {t('session.clearSelection')}
                                </button>
                            </div>
                        </div>

                        {/* Player Selection Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto">
                            {users
                                .filter(
                                    (user) =>
                                        !players.some(
                                            (p) =>
                                                p.userId === user.id
                                        )
                                )
                                .map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex items-center space-x-2 p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(
                                                user.id
                                            )}
                                            onChange={(e) =>
                                                handlePlayerSelection(
                                                    user.id,
                                                    e.target.checked
                                                )
                                            }
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-900 truncate">
                                            {user.name}
                                        </span>
                                    </label>
                                ))}
                        </div>

                        {/* Bulk Buy-in Input */}
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={bulkBuyInAmount}
                                onChange={(e) =>
                                    setBulkBuyInAmount(e.target.value)
                                }
                                placeholder={t('common.buyInAmount')}
                                min={minBuyIn}
                                step="0.01"
                                className="flex-1 rounded-md border border-gray-300 shadow-sm p-2 text-gray-900"
                            />
                            <button
                                type="button"
                                onClick={addSelectedPlayers}
                                disabled={
                                    selectedUserIds.length === 0
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {t('session.addSelected')} (
                                {selectedUserIds.length})
                            </button>
                        </div>
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
                                                ₺{player.initialBuyIn}
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
