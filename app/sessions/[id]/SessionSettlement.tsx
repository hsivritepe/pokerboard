'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/ui/toast-context';
import { formatNumber } from '@/lib/utils';
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

interface Player {
    id: string;
    userId: string;
    user: {
        name: string;
        email: string;
    };
    initialBuyIn: number;
    currentStack: number;
    status: string;
    transactions?: {
        id: string;
        type: string;
        amount: number;
    }[];
}

interface SessionSettlementProps {
    sessionId: string;
    players: Player[];
    isHost: boolean;
    isAdmin: boolean;
    isCompleted: boolean;
}

export default function SessionSettlement({
    sessionId,
    players,
    isHost,
    isAdmin,
    isCompleted,
}: SessionSettlementProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [sessionCost, setSessionCost] = useState<number | ''>('');
    const [settlementDialogOpen, setSettlementDialogOpen] =
        useState(false);
    const [error, setError] = useState('');
    const [isSavingCost, setIsSavingCost] = useState(false);

    // Fetch the current session cost when the component loads
    useEffect(() => {
        const fetchSessionCost = async () => {
            try {
                const response = await fetch(
                    `/api/sessions/${sessionId}`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (
                        data.sessionCost !== null &&
                        data.sessionCost !== undefined
                    ) {
                        setSessionCost(data.sessionCost);
                    }
                }
            } catch (error) {
                console.error('Error fetching session cost:', error);
            }
        };

        fetchSessionCost();
    }, [sessionId]);

    // Function to save the session cost
    const handleSaveSessionCost = async () => {
        if (sessionCost === '') {
            setError('Please enter a valid session cost');
            return;
        }

        setIsSavingCost(true);
        setError('');

        try {
            console.log('Saving session cost:', sessionCost);
            console.log('Session ID:', sessionId);

            const response = await fetch(
                `/api/sessions/${sessionId}/update-cost`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionCost: Number(sessionCost),
                    }),
                }
            );

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response text:', errorText);
                throw new Error(
                    errorText || 'Failed to update session cost'
                );
            }

            const data = await response.json();
            console.log('Response data:', data);

            showToast(
                data.message || 'Session cost updated successfully',
                'success'
            );
        } catch (error) {
            console.error('Error updating session cost:', error);

            if (error instanceof Error) {
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update session cost'
            );
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to update session cost',
                'error'
            );
        } finally {
            setIsSavingCost(false);
        }
    };

    // Calculate total buy-ins for each player
    const playersWithTotalBuyIns = players.map((player) => {
        const buyInTransactions =
            player.transactions?.filter(
                (t) => t.type === 'BUY_IN' || t.type === 'REBUY'
            ) || [];

        const totalBuyIn =
            buyInTransactions.length > 0
                ? buyInTransactions.reduce(
                      (sum, t) => sum + t.amount,
                      0
                  )
                : player.initialBuyIn;

        return {
            ...player,
            totalBuyIn,
            // Only calculate profit/loss for cashed out players
            profitLoss:
                player.status === 'CASHED_OUT'
                    ? player.currentStack - totalBuyIn
                    : 0,
        };
    });

    // Only consider cashed out players for settlement
    const settledPlayers = playersWithTotalBuyIns.filter(
        (player) => player.status === 'CASHED_OUT'
    );

    // Get active players (not cashed out)
    const activePlayers = playersWithTotalBuyIns.filter(
        (player) => player.status === 'ACTIVE'
    );

    // Calculate total buy-ins for all players
    const totalBuyIns = playersWithTotalBuyIns.reduce(
        (sum, player) => sum + player.totalBuyIn,
        0
    );

    // Calculate total cash out for settled players
    const totalCashOut = settledPlayers.reduce(
        (sum, player) => sum + player.currentStack,
        0
    );

    // Calculate what the remaining active players should cash out with to maintain balance
    const calculateRequiredCashOut = () => {
        if (activePlayers.length === 1) {
            // If there's only one active player left, they should cash out with the remaining amount
            const lastPlayer = activePlayers[0];
            const requiredCashOut = totalBuyIns - totalCashOut;
            return {
                playerId: lastPlayer.id,
                playerName: lastPlayer.user.name,
                currentStack: lastPlayer.currentStack,
                requiredCashOut:
                    requiredCashOut > 0 ? requiredCashOut : 0,
                difference: requiredCashOut - lastPlayer.currentStack,
            };
        }
        return null;
    };

    const lastPlayerCashOut = calculateRequiredCashOut();

    // Calculate total profit and total loss
    const totalProfit = settledPlayers.reduce(
        (sum, player) =>
            player.profitLoss > 0 ? sum + player.profitLoss : sum,
        0
    );

    const totalLoss = settledPlayers.reduce(
        (sum, player) =>
            player.profitLoss < 0
                ? sum + Math.abs(player.profitLoss)
                : sum,
        0
    );

    // Check if profits and losses balance
    const isBalanced = Math.abs(totalProfit - totalLoss) < 0.01; // Allow for small rounding errors

    // Calculate settlement with session cost
    const calculateSettlement = (cost: number) => {
        // Only winners pay for the session cost
        const winners = settledPlayers.filter(
            (player) => player.profitLoss > 0
        );

        // Calculate cost distribution based on proportion of winnings
        const costDistribution = winners.map((player) => {
            const proportion = player.profitLoss / totalProfit;
            const costShare = cost * proportion;
            return {
                ...player,
                costShare,
                finalProfit: player.profitLoss - costShare,
            };
        });

        // Calculate final settlement for all players
        return settledPlayers.map((player) => {
            if (player.profitLoss > 0) {
                const winner = costDistribution.find(
                    (w) => w.id === player.id
                );
                return {
                    ...player,
                    costShare: winner?.costShare || 0,
                    finalProfit:
                        winner?.finalProfit || player.profitLoss,
                };
            } else {
                return {
                    ...player,
                    costShare: 0,
                    finalProfit: player.profitLoss,
                };
            }
        });
    };

    const handleSettlementCalculation = () => {
        if (!sessionCost && sessionCost !== 0) {
            setError('Please enter a valid session cost');
            return;
        }

        if (!isBalanced) {
            const difference = Math.abs(
                totalProfit - totalLoss
            ).toFixed(2);
            setError(
                `Settlement imbalance detected: $${difference} difference between profits and losses. For accurate results, the total profits should equal the total losses. Please adjust player cash out amounts before calculating settlement.`
            );
            // Continue with settlement calculation even if not balanced
        } else {
            setError(''); // Clear error if balanced
        }

        setSettlementDialogOpen(true);
    };

    const handleSaveSettlement = async () => {
        // Here you would implement saving the settlement to the database
        // For now, we'll just show a success toast
        showToast('Settlement calculated successfully', 'success');
        setSettlementDialogOpen(false);
    };

    // Only show the settlement button if all players have cashed out and the session is completed
    const canSettle =
        isCompleted &&
        players.every((player) => player.status === 'CASHED_OUT') &&
        (isHost || isAdmin);

    // Calculate settlement with current session cost for display
    const settlement =
        sessionCost !== ''
            ? calculateSettlement(Number(sessionCost))
            : [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-lg font-semibold">Settlement</h2>
                {(isHost || isAdmin) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex space-x-2 items-center">
                            <Label
                                htmlFor="sessionCost"
                                className="whitespace-nowrap text-sm"
                            >
                                Session Cost:
                            </Label>
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                                    $
                                </span>
                                <Input
                                    id="sessionCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={sessionCost}
                                    onChange={(e) =>
                                        setSessionCost(
                                            e.target.value === ''
                                                ? ''
                                                : Number(
                                                      e.target.value
                                                  )
                                        )
                                    }
                                    className="pl-5 h-9 text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveSessionCost}
                            disabled={isSavingCost}
                            className="h-9 py-0 px-3 text-sm"
                        >
                            {isSavingCost ? 'Saving...' : 'Save Cost'}
                        </Button>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {isCompleted && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-800 mb-1">
                                Total Buy-ins
                            </h3>
                            <p className="text-lg font-semibold">
                                ${totalBuyIns.toString()}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800 mb-1">
                                Total Cash Out
                            </h3>
                            <p className="text-lg font-semibold">
                                ${totalCashOut.toString()}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800 mb-1">
                                Total Profit
                            </h3>
                            <p className="text-lg font-semibold">
                                ${totalProfit.toString()}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-red-800 mb-1">
                                Total Loss
                            </h3>
                            <p className="text-lg font-semibold">
                                ${totalLoss.toString()}
                            </p>
                        </div>
                    </div>

                    {lastPlayerCashOut && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-800 mb-2">
                                Last Player Cash Out Recommendation
                            </h3>
                            <p className="text-sm">
                                {lastPlayerCashOut.playerName} should
                                cash out with{' '}
                                <span className="font-semibold">
                                    $
                                    {lastPlayerCashOut.requiredCashOut.toString()}
                                </span>{' '}
                                to maintain balance.
                            </p>
                            {lastPlayerCashOut.difference !== 0 && (
                                <p className="text-sm mt-1">
                                    {lastPlayerCashOut.difference >
                                    0 ? (
                                        <>
                                            This is{' '}
                                            <span className="text-red-600 font-medium">
                                                $
                                                {lastPlayerCashOut.difference.toString()}
                                            </span>{' '}
                                            more than their current
                                            stack.
                                        </>
                                    ) : (
                                        <>
                                            Their current stack is{' '}
                                            <span className="text-green-600 font-medium">
                                                $
                                                {Math.abs(
                                                    lastPlayerCashOut.difference
                                                ).toString()}
                                            </span>{' '}
                                            more than needed.
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Settlement calculations button */}
                    <div className="flex justify-center mt-4">
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                onClick={handleSettlementCalculation}
                                className="w-full sm:w-auto"
                            >
                                Calculate Settlement
                            </Button>

                            {sessionCost !== null &&
                                sessionCost !== '' &&
                                Number(sessionCost) > 0 && (
                                    <Button
                                        onClick={() =>
                                            setSettlementDialogOpen(
                                                true
                                            )
                                        }
                                        className="w-full sm:w-auto"
                                    >
                                        Show Settlement (with cost)
                                    </Button>
                                )}
                        </div>
                    </div>

                    {/* Mobile player results */}
                    <div className="sm:hidden space-y-4 mt-4">
                        {settledPlayers.map((player) => (
                            <div
                                key={player.id}
                                className={`p-3 rounded-lg ${
                                    player.profitLoss > 0
                                        ? 'bg-green-50'
                                        : player.profitLoss < 0
                                        ? 'bg-red-50'
                                        : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-sm font-medium">
                                        {player.user.name}
                                    </div>
                                    <div
                                        className={`text-sm font-semibold ${
                                            player.profitLoss > 0
                                                ? 'text-green-600'
                                                : player.profitLoss <
                                                  0
                                                ? 'text-red-600'
                                                : ''
                                        }`}
                                    >
                                        {player.profitLoss > 0
                                            ? '+'
                                            : ''}
                                        $
                                        {player.profitLoss.toString()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div>
                                        <span className="text-gray-500">
                                            Buy-in:
                                        </span>
                                        <span className="font-medium ml-1">
                                            $
                                            {player.totalBuyIn.toString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">
                                            Cash Out:
                                        </span>
                                        <span className="font-medium ml-1">
                                            $
                                            {player.currentStack.toString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop/Tablet player results */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 mt-4">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Player
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Total Buy-in
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Cash Out
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Profit/Loss
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {settledPlayers.map((player) => (
                                    <tr key={player.id}>
                                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {player.user.name}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                            $
                                            {player.totalBuyIn.toString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                            $
                                            {player.currentStack.toString()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-right">
                                            <span
                                                className={
                                                    player.profitLoss >
                                                    0
                                                        ? 'text-green-600 font-semibold'
                                                        : player.profitLoss <
                                                          0
                                                        ? 'text-red-600 font-semibold'
                                                        : ''
                                                }
                                            >
                                                {player.profitLoss > 0
                                                    ? '+'
                                                    : ''}
                                                $
                                                {player.profitLoss.toString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Settlement Dialog */}
            <Dialog
                open={settlementDialogOpen}
                onOpenChange={setSettlementDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Settlement Details (with session cost)
                        </DialogTitle>
                        <DialogDescription>
                            Session cost of $
                            {formatNumber(Number(sessionCost))}{' '}
                            distributed among winners
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto py-4">
                        {sessionCost !== null &&
                            sessionCost !== '' &&
                            calculateSettlement(
                                Number(sessionCost)
                            )?.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white p-3 border rounded-lg"
                                >
                                    <div className="font-medium text-gray-900 mb-1">
                                        {item.user.name}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">
                                                Original:
                                            </span>
                                            <span
                                                className={`ml-1 font-medium ${
                                                    item.profitLoss >
                                                    0
                                                        ? 'text-green-600'
                                                        : item.profitLoss <
                                                          0
                                                        ? 'text-red-600'
                                                        : ''
                                                }`}
                                            >
                                                {item.profitLoss > 0
                                                    ? '+'
                                                    : ''}
                                                $
                                                {item.profitLoss.toString()}
                                            </span>
                                        </div>
                                        {item.costShare > 0 && (
                                            <div>
                                                <span className="text-gray-500">
                                                    Session Cost:
                                                </span>
                                                <span className="ml-1 font-medium text-red-600">
                                                    -$
                                                    {item.costShare.toString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <span className="text-gray-500">
                                                Final Amount:
                                            </span>
                                            <span
                                                className={`ml-1 font-medium ${
                                                    item.finalProfit >
                                                    0
                                                        ? 'text-green-600'
                                                        : item.finalProfit <
                                                          0
                                                        ? 'text-red-600'
                                                        : ''
                                                }`}
                                            >
                                                {item.finalProfit > 0
                                                    ? '+'
                                                    : ''}
                                                $
                                                {item.finalProfit.toString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                setSettlementDialogOpen(false)
                            }
                            className="sm:w-auto"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSaveSettlement}
                            disabled={isLoading}
                            className="sm:w-auto"
                        >
                            {isLoading
                                ? 'Saving...'
                                : 'Save Settlement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
