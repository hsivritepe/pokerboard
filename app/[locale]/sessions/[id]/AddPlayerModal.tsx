'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Combobox } from '@headlessui/react';
import {
    ChevronUpDownIcon,
    CheckIcon,
    PlusIcon,
} from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AddPlayerModalProps {
    sessionId: string;
    onClose: () => void;
    minimumBuyIn: number;
}

export default function AddPlayerModal({
    sessionId,
    onClose,
    minimumBuyIn,
}: AddPlayerModalProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'select' | 'create'>('select');
    const [query, setQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(
        null
    );
    const [users, setUsers] = useState<User[]>([]);
    const [buyInAmount, setBuyInAmount] = useState<string>('');
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');

    useEffect(() => {
        // Load initial users list
        fetchUsers('');
    }, []);

    const fetchUsers = async (searchQuery: string) => {
        try {
            const response = await fetch(
                `/api/users/search?q=${encodeURIComponent(
                    searchQuery
                )}`
            );
            if (!response.ok)
                throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) {
                fetchUsers(query);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAddExistingPlayer = async () => {
        if (!selectedUser) {
            alert('Please select a user');
            return;
        }

        if (!buyInAmount || parseFloat(buyInAmount) < minimumBuyIn) {
            alert(`Minimum buy-in amount is ₺${minimumBuyIn}`);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/sessions/${sessionId}/players`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: selectedUser.id,
                        initialBuyIn: parseFloat(buyInAmount),
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: 'Failed to add player' }));
                const errorMessage = errorData.messageKey
                    ? t(errorData.messageKey)
                    : errorData.error || 'Failed to add player';
                throw new Error(errorMessage);
            }

            router.refresh();
            onClose();
        } catch (error) {
            console.error('Error adding player:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to add player. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAndAddPlayer = async () => {
        if (!newPlayerName) {
            alert('Please enter a player name');
            return;
        }

        if (!buyInAmount || parseFloat(buyInAmount) < minimumBuyIn) {
            alert(`Minimum buy-in amount is ₺${minimumBuyIn}`);
            return;
        }

        try {
            setIsLoading(true);

            // First create the user/player
            const createUserResponse = await fetch(
                '/api/users/quick-create',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newPlayerName,
                        email: newPlayerEmail || null,
                        sessionId: sessionId,
                    }),
                }
            );

            if (!createUserResponse.ok) {
                const error = await createUserResponse.text();
                throw new Error(error || 'Failed to create player');
            }

            const newUser = await createUserResponse.json();

            // Then add them to the session
            const addPlayerResponse = await fetch(
                `/api/sessions/${sessionId}/players`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: newUser.id,
                        initialBuyIn: parseFloat(buyInAmount),
                    }),
                }
            );

            if (!addPlayerResponse.ok) {
                const error = await addPlayerResponse.text();
                throw new Error(
                    error || 'Failed to add player to session'
                );
            }

            router.refresh();
            onClose();
        } catch (error) {
            console.error('Error creating and adding player:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to create and add player. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-[32rem] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">
                        Add Player
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <button
                            className={`flex-1 py-2 px-4 rounded-md ${
                                mode === 'select'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => setMode('select')}
                        >
                            Select Existing
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md ${
                                mode === 'create'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => setMode('create')}
                        >
                            Quick Create
                        </button>
                    </div>

                    {mode === 'select' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Player
                            </label>
                            <Combobox
                                value={selectedUser}
                                onChange={setSelectedUser}
                            >
                                <div className="relative">
                                    <div className="relative w-full">
                                        <Combobox.Input
                                            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            displayValue={(
                                                user: User
                                            ) => user?.name || ''}
                                            onChange={(event) =>
                                                setQuery(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Search for a player..."
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
                                            <ChevronUpDownIcon
                                                className="h-5 w-5 text-gray-400"
                                                aria-hidden="true"
                                            />
                                        </Combobox.Button>
                                    </div>
                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {users.length === 0 &&
                                        query !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                Nothing found.
                                            </div>
                                        ) : (
                                            users.map((user) => (
                                                <Combobox.Option
                                                    key={user.id}
                                                    className={({
                                                        active,
                                                    }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                            active
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-gray-900'
                                                        }`
                                                    }
                                                    value={user}
                                                >
                                                    {({
                                                        selected,
                                                        active,
                                                    }) => (
                                                        <>
                                                            <span
                                                                className={`block truncate ${
                                                                    selected
                                                                        ? 'font-medium'
                                                                        : 'font-normal'
                                                                }`}
                                                            >
                                                                {
                                                                    user.name
                                                                }{' '}
                                                                (
                                                                {
                                                                    user.email
                                                                }
                                                                )
                                                            </span>
                                                            {selected ? (
                                                                <span
                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                                        active
                                                                            ? 'text-white'
                                                                            : 'text-blue-600'
                                                                    }`}
                                                                >
                                                                    <CheckIcon
                                                                        className="h-5 w-5"
                                                                        aria-hidden="true"
                                                                    />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))
                                        )}
                                    </Combobox.Options>
                                </div>
                            </Combobox>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Player Name{' '}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(e) =>
                                        setNewPlayerName(
                                            e.target.value
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Enter player name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={newPlayerEmail}
                                    onChange={(e) =>
                                        setNewPlayerEmail(
                                            e.target.value
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="Optional email address"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Buy-in Amount{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">
                                    $
                                </span>
                            </div>
                            <input
                                type="number"
                                value={buyInAmount}
                                onChange={(e) =>
                                    setBuyInAmount(e.target.value)
                                }
                                min={minimumBuyIn}
                                step="0.01"
                                className="block w-full pl-7 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder={`${minimumBuyIn} minimum`}
                            />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Minimum buy-in: ₺{minimumBuyIn}
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={
                                mode === 'select'
                                    ? handleAddExistingPlayer
                                    : handleCreateAndAddPlayer
                            }
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading
                                ? t('loading.adding')
                                : t('playerManagement.addPlayer')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
