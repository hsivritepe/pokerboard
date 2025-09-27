'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface PlayerActionsProps {
    sessionId: string;
    playerId: string;
    playerStatus: string;
    isHost: boolean;
    isAdmin: boolean;
    isSelf: boolean;
}

export default function PlayerActions({
    sessionId,
    playerId,
    playerStatus,
    isHost,
    isAdmin,
    isSelf,
}: PlayerActionsProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isAddingChips, setIsAddingChips] = useState(false);
    const [isCashingOut, setIsCashingOut] = useState(false);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddChips = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/sessions/${sessionId}/players/${playerId}/chips`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        type: 'REBUY',
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.text();
                throw new Error(data);
            }

            setIsAddingChips(false);
            setAmount('');
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to add chips'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCashOut = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            setError('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/sessions/${sessionId}/players/${playerId}/cashout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.text();
                throw new Error(data);
            }

            setIsCashingOut(false);
            setAmount('');
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to cash out'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (playerStatus !== 'ACTIVE') {
        return null;
    }

    return (
        <div className="space-y-4">
            {(isHost || isAdmin || isSelf) && (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setIsAddingChips(true);
                            setIsCashingOut(false);
                            setError('');
                            setAmount('');
                        }}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                            isAddingChips
                                ? 'bg-green-100 text-green-800'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {t('playerManagement.addChips')}
                    </button>
                    <button
                        onClick={() => {
                            setIsCashingOut(true);
                            setIsAddingChips(false);
                            setError('');
                            setAmount('');
                        }}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                            isCashingOut
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        Cash Out
                    </button>
                </div>
            )}

            {(isAddingChips || isCashingOut) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium">
                        {isAddingChips
                            ? t('playerManagement.addChips')
                            : t('playerManagement.cashOut')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Amount
                            </label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(e.target.value)
                                }
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setIsAddingChips(false);
                                    setIsCashingOut(false);
                                    setError('');
                                    setAmount('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={
                                    isAddingChips
                                        ? handleAddChips
                                        : handleCashOut
                                }
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isLoading
                                    ? t('playerManagement.processing')
                                    : isAddingChips
                                    ? t('playerManagement.addChips')
                                    : t('playerManagement.cashOut')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
