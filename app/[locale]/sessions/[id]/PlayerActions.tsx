'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast-context';

interface PlayerActionsProps {
    sessionId: string;
    playerId: string;
    playerName: string;
    isActive: boolean;
    currentStack: number;
    minimumBuyIn: number;
}

export default function PlayerActions({
    sessionId,
    playerId,
    playerName,
    isActive,
    currentStack,
    minimumBuyIn,
}: PlayerActionsProps) {
    const router = useRouter();
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [rejoinDialogOpen, setRejoinDialogOpen] = useState(false);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [addChipsDialogOpen, setAddChipsDialogOpen] =
        useState(false);
    const [additionalBuyIn, setAdditionalBuyIn] = useState<
        number | ''
    >('');
    const [leaveAmount, setLeaveAmount] = useState<number | ''>(
        currentStack
    );
    const [chipAmount, setChipAmount] = useState<number | ''>('');
    const [error, setError] = useState('');
    const [requiredCashOut, setRequiredCashOut] = useState<
        number | null
    >(null);
    const [isLastPlayer, setIsLastPlayer] = useState(false);
    const { showToast } = useToast();

    // Fetch required cash out amount when opening the leave dialog
    useEffect(() => {
        if (leaveDialogOpen && isActive) {
            const fetchRequiredCashOut = async () => {
                try {
                    const response = await fetch(
                        `/api/sessions/${sessionId}/balance-info?playerId=${playerId}`,
                        {
                            method: 'GET',
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.isLastPlayer) {
                            setIsLastPlayer(true);
                            setRequiredCashOut(data.requiredCashOut);
                            setLeaveAmount(data.requiredCashOut);
                        } else {
                            setIsLastPlayer(false);
                            setRequiredCashOut(null);
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error fetching balance info:',
                        error
                    );
                }
            };

            fetchRequiredCashOut();
        } else {
            setRequiredCashOut(null);
            setIsLastPlayer(false);
        }
    }, [leaveDialogOpen, sessionId, playerId, isActive]);

    const handleLeaveGame = async () => {
        if (!leaveAmount && leaveAmount !== 0) {
            setError('Please enter a valid amount');
            return;
        }

        // Convert to number to ensure proper comparison
        const leaveAmountNum = Number(leaveAmount);

        if (leaveAmountNum < 0) {
            setError('Cannot leave with a negative amount');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log(
                'Sending leave request with amount:',
                leaveAmountNum
            );

            const response = await fetch(
                `/api/sessions/${sessionId}/players/${playerId}/leave`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leaveAmount: leaveAmountNum,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || 'Failed to remove player'
                );
            }

            const data = await response.json();
            showToast(
                data.message || `${playerName} has left the game`,
                'success'
            );
            setLeaveDialogOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Error removing player:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to remove player'
            );
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to remove player',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejoinGame = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/sessions/${sessionId}/players/${playerId}/rejoin`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        additionalBuyIn:
                            additionalBuyIn === ''
                                ? 0
                                : Number(additionalBuyIn),
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || 'Failed to rejoin player'
                );
            }

            const data = await response.json();
            showToast(
                data.message || `${playerName} has rejoined the game`,
                'success'
            );
            setRejoinDialogOpen(false);
            router.refresh();
        } catch (error) {
            console.error('Error rejoining player:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to rejoin player'
            );
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to rejoin player',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddChips = async () => {
        if (!chipAmount || chipAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/sessions/${sessionId}/players/${playerId}/add-chips`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: Number(chipAmount),
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to add chips');
            }

            const data = await response.json();
            showToast(
                data.message || `Added chips to ${playerName}`,
                'success'
            );
            setAddChipsDialogOpen(false);
            setChipAmount('');
            router.refresh();
        } catch (error) {
            console.error('Error adding chips:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to add chips'
            );
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to add chips',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex space-x-2">
            {isActive ? (
                <>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setLeaveDialogOpen(true)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Leave Game'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddChipsDialogOpen(true)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Add Chips'}
                    </Button>
                </>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejoinDialogOpen(true)}
                    disabled={isLoading}
                >
                    {isLoading
                        ? t('playerManagement.processing')
                        : t('playerManagement.rejoinGame')}
                </Button>
            )}

            {/* Leave Dialog */}
            <Dialog
                open={leaveDialogOpen}
                onOpenChange={setLeaveDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Game</DialogTitle>
                        <DialogDescription>
                            {playerName} will leave the game. Please
                            specify how many chips they are cashing
                            out with.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <div className="mb-4">
                            <Label
                                htmlFor="leaveAmount"
                                className="block mb-2"
                            >
                                Cash Out Amount
                            </Label>
                            <div className="mb-2 text-sm text-gray-600">
                                <p>
                                    Current stack: $
                                    {currentStack.toFixed(2)}
                                </p>
                                {isLastPlayer &&
                                requiredCashOut !== null ? (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-yellow-700 font-semibold">
                                            You are the last active
                                            player. To maintain
                                            balance, you must cash out
                                            with:
                                        </p>
                                        <p className="text-yellow-700 font-bold text-lg mt-1">
                                            $
                                            {requiredCashOut.toFixed(
                                                2
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <p>
                                        You can cash out with any
                                        amount.
                                    </p>
                                )}
                            </div>
                            <Input
                                id="leaveAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Enter cash out amount"
                                value={leaveAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLeaveAmount(
                                        value === ''
                                            ? ''
                                            : Number(value)
                                    );
                                }}
                                className="w-full"
                                disabled={
                                    isLastPlayer &&
                                    requiredCashOut !== null
                                }
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm mt-2">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setLeaveDialogOpen(false);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLeaveGame}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Processing...'
                                : 'Leave Game'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejoin Dialog */}
            <Dialog
                open={rejoinDialogOpen}
                onOpenChange={setRejoinDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('playerManagement.rejoinGame')}
                        </DialogTitle>
                        <DialogDescription>
                            {playerName} will rejoin the game with
                            their previous stack of $
                            {currentStack.toFixed(2)}. You can
                            optionally add more chips.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <div className="mb-4">
                            <Label
                                htmlFor="additionalBuyIn"
                                className="block mb-2"
                            >
                                Additional Buy-in (optional)
                            </Label>
                            <Input
                                id="additionalBuyIn"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={`Min: $0`}
                                value={additionalBuyIn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setAdditionalBuyIn(
                                        value === ''
                                            ? ''
                                            : Number(value)
                                    );
                                }}
                                className="w-full"
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm mt-2">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejoinDialogOpen(false);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRejoinGame}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? t('playerManagement.processing')
                                : t('playerManagement.rejoinGame')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Chips Dialog */}
            <Dialog
                open={addChipsDialogOpen}
                onOpenChange={setAddChipsDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Chips</DialogTitle>
                        <DialogDescription>
                            Add more chips to {playerName}'s stack.
                            Available chips: $
                            {currentStack.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <div className="mb-4">
                            <Label
                                htmlFor="chipAmount"
                                className="block mb-2"
                            >
                                Amount to Add
                            </Label>
                            <Input
                                id="chipAmount"
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Enter amount"
                                value={chipAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setChipAmount(
                                        value === ''
                                            ? ''
                                            : Number(value)
                                    );
                                }}
                                className="w-full"
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm mt-2">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddChipsDialogOpen(false);
                                setChipAmount('');
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddChips}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Processing...'
                                : 'Add Chips'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
