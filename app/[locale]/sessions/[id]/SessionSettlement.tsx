'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/ui/toast-context';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [sessionCost, setSessionCost] = useState<number | ''>('');
    const [discount, setDiscount] = useState<number | ''>('');
    const [settlementDialogOpen, setSettlementDialogOpen] =
        useState(false);
    const [error, setError] = useState('');
    const [isSavingCost, setIsSavingCost] = useState(false);
    const [savedSettlement, setSavedSettlement] = useState<
        any[] | null
    >(null);

    // Fetch the current session cost and settlement results when the component loads
    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                // Fetch session cost
                const sessionResponse = await fetch(
                    `/api/sessions/${sessionId}`
                );
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    if (
                        sessionData.sessionCost !== null &&
                        sessionData.sessionCost !== undefined
                    ) {
                        setSessionCost(sessionData.sessionCost);
                    }
                    if (
                        sessionData.discount !== null &&
                        sessionData.discount !== undefined
                    ) {
                        setDiscount(sessionData.discount);
                    }
                }

                // Fetch existing settlement results
                const settlementResponse = await fetch(
                    `/api/sessions/${sessionId}/settlement`
                );
                if (settlementResponse.ok) {
                    const settlementData =
                        await settlementResponse.json();
                    if (
                        settlementData.settlementResults &&
                        settlementData.settlementResults.length > 0
                    ) {
                        // Convert database format to component format
                        const formattedSettlements =
                            settlementData.settlementResults.map(
                                (item: any) => ({
                                    id: item.player.id,
                                    userId: item.player.id,
                                    user: {
                                        name: item.player.name,
                                        email: item.player.email,
                                    },
                                    profitLoss:
                                        item.originalProfitLoss,
                                    costShare: item.sessionCostShare,
                                    finalProfit: item.finalAmount,
                                })
                            );
                        setSavedSettlement(formattedSettlements);
                    }
                }
            } catch (error) {
                console.error('Error fetching session data:', error);
            }
        };

        fetchSessionData();
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
                        discount: Number(discount) || 0,
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

            const message = data.messageKey
                ? t(data.messageKey, data.messageParams)
                : data.message ||
                  t('sessionCost.updatedSuccessfully');

            showToast(message, 'success');
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

    // Helper function to abbreviate names for mobile display
    const abbreviateName = (fullName: string) => {
        const names = fullName.split(' ');
        if (names.length >= 2) {
            return `${names[0].substring(0, 2)} ${names[1].substring(
                0,
                2
            )}`;
        }
        return fullName.substring(0, 4);
    };

    // Calculate settlement with session cost and discount
    const calculateSettlement = (
        cost: number,
        discountPercent: number = 0
    ) => {
        // Apply discount to ALL profit/loss values (both winners and losers)
        const adjustedPlayers = settledPlayers.map((player) => {
            const discountAmount = Math.round(
                Math.abs(player.profitLoss) * (discountPercent / 100)
            );
            if (player.profitLoss > 0) {
                // Apply discount to winners (reduce their profit)
                return {
                    ...player,
                    adjustedProfitLoss: Math.round(
                        player.profitLoss - discountAmount
                    ),
                    discountAmount,
                };
            } else if (player.profitLoss < 0) {
                // Apply discount to losers (reduce their loss)
                return {
                    ...player,
                    adjustedProfitLoss: Math.round(
                        player.profitLoss + discountAmount
                    ),
                    discountAmount,
                };
            } else {
                // No change for break-even players
                return {
                    ...player,
                    adjustedProfitLoss: player.profitLoss,
                    discountAmount: 0,
                };
            }
        });

        // Calculate new totals after discount
        const adjustedTotalProfit = adjustedPlayers
            .filter((player) => player.adjustedProfitLoss > 0)
            .reduce(
                (sum, player) => sum + player.adjustedProfitLoss,
                0
            );

        // Only winners pay for the session cost (based on adjusted profits)
        const winners = adjustedPlayers.filter(
            (player) => player.adjustedProfitLoss > 0
        );

        // Calculate cost distribution based on proportion of adjusted winnings
        const costDistribution = winners.map((player) => {
            const proportion =
                player.adjustedProfitLoss / adjustedTotalProfit;
            const costShare = Math.round(cost * proportion);
            return {
                ...player,
                costShare,
                finalProfit: Math.round(
                    player.adjustedProfitLoss - costShare
                ),
            };
        });

        // Calculate final settlement for all players
        return adjustedPlayers.map((player) => {
            if (player.adjustedProfitLoss > 0) {
                const winner = costDistribution.find(
                    (w) => w.id === player.id
                );
                return {
                    ...player,
                    costShare: winner?.costShare || 0,
                    finalProfit: Math.round(
                        winner?.finalProfit ||
                            player.adjustedProfitLoss
                    ),
                };
            } else {
                return {
                    ...player,
                    costShare: 0,
                    finalProfit: Math.round(
                        player.adjustedProfitLoss
                    ),
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
            const difference = Math.abs(totalProfit - totalLoss);
            setError(
                `Settlement imbalance detected: ₺${difference} difference between profits and losses. For accurate results, the total profits should equal the total losses. Please adjust player cash out amounts before calculating settlement.`
            );
            // Continue with settlement calculation even if not balanced
        } else {
            setError(''); // Clear error if balanced
        }

        setSettlementDialogOpen(true);
    };

    const handleSaveSettlement = async () => {
        try {
            setIsLoading(true);

            // Calculate the settlement results
            const settlementResults = calculateSettlement(
                Number(sessionCost),
                Number(discount) || 0
            );

            // Save to database
            const response = await fetch(
                `/api/sessions/${sessionId}/settlement`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ settlementResults }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save settlement results');
            }

            // Update local state
            setSavedSettlement(settlementResults);

            showToast(
                t('toast.settlementCalculatedSuccessfully'),
                'success'
            );
            setSettlementDialogOpen(false);
        } catch (error) {
            console.error('Error saving settlement:', error);
            showToast('Failed to save settlement results', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Only show the settlement button if all players have cashed out and the session is completed
    const canSettle =
        isCompleted &&
        players.every((player) => player.status === 'CASHED_OUT') &&
        (isHost || isAdmin);

    // Calculate settlement with current session cost for display
    const settlement =
        sessionCost !== ''
            ? calculateSettlement(
                  Number(sessionCost),
                  Number(discount) || 0
              )
            : [];

    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                {(isHost || isAdmin) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex space-x-2 items-center">
                            <Label
                                htmlFor="sessionCost"
                                className="whitespace-nowrap text-sm"
                            >
                                {t('settlement.sessionCost')}:
                            </Label>
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                                    ₺
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
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <Label
                                htmlFor="discount"
                                className="whitespace-nowrap text-sm"
                            >
                                {t('settlement.discount')}:
                            </Label>
                            <div className="relative flex-1">
                                <Input
                                    id="discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={discount}
                                    onChange={(e) =>
                                        setDiscount(
                                            e.target.value === ''
                                                ? ''
                                                : Number(
                                                      e.target.value
                                                  )
                                        )
                                    }
                                    className="h-9 text-sm"
                                    placeholder="0"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-sm">
                                    %
                                </span>
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveSessionCost}
                            disabled={isSavingCost}
                            className="h-9 py-0 px-3 text-sm"
                        >
                            {isSavingCost
                                ? t('settlement.saving')
                                : t('settlement.saveCost')}
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
                                {t('settlement.totalBuyIns')}
                            </h3>
                            <p className="text-lg font-semibold">
                                ₺{formatNumber(totalBuyIns)}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800 mb-1">
                                {t('settlement.totalCashOut')}
                            </h3>
                            <p className="text-lg font-semibold">
                                ₺{formatNumber(totalCashOut)}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-green-800 mb-1">
                                {t('settlement.totalProfit')}
                            </h3>
                            <p className="text-lg font-semibold">
                                ₺{formatNumber(totalProfit)}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium text-red-800 mb-1">
                                {t('settlement.totalLoss')}
                            </h3>
                            <p className="text-lg font-semibold">
                                ₺{formatNumber(totalLoss)}
                            </p>
                        </div>
                    </div>

                    {lastPlayerCashOut && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-sm font-medium text-yellow-800 mb-2">
                                {t(
                                    'settlement.lastPlayerCashOutRecommendation'
                                )}
                            </h3>
                            <p className="text-sm">
                                {lastPlayerCashOut.playerName} should
                                cash out with{' '}
                                <span className="font-semibold">
                                    ₺
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
                                                ₺
                                                {lastPlayerCashOut.difference.toString()}
                                            </span>{' '}
                                            more than their current
                                            stack.
                                        </>
                                    ) : (
                                        <>
                                            Their current stack is{' '}
                                            <span className="text-green-600 font-medium">
                                                ₺
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
                                {t('settlement.calculateSettlement')}
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
                                        {t(
                                            'settlement.showSettlement'
                                        )}
                                    </Button>
                                )}
                        </div>
                    </div>

                    {/* Saved Settlement Results Table */}
                    {savedSettlement &&
                        savedSettlement.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    {t(
                                        'settlement.savedSettlementResults'
                                    )}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {t(
                                                        'settlement.player'
                                                    )}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {t(
                                                        'settlement.originalProfitLoss'
                                                    )}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {t(
                                                        'settlement.sessionCostShare'
                                                    )}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {t(
                                                        'settlement.finalAmount'
                                                    )}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {savedSettlement.map(
                                                (item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                <span className="sm:hidden">
                                                                    {abbreviateName(
                                                                        item
                                                                            .user
                                                                            .name
                                                                    )}
                                                                </span>
                                                                <span className="hidden sm:inline">
                                                                    {
                                                                        item
                                                                            .user
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={
                                                                    item.profitLoss >
                                                                    0
                                                                        ? 'text-green-600 font-semibold'
                                                                        : item.profitLoss <
                                                                          0
                                                                        ? 'text-red-600 font-semibold'
                                                                        : 'text-gray-900'
                                                                }
                                                            >
                                                                {item.profitLoss >
                                                                0
                                                                    ? '+'
                                                                    : ''}
                                                                ₺
                                                                {formatNumber(
                                                                    item.profitLoss
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                            {item.costShare >
                                                            0 ? (
                                                                <span className="text-red-600 font-medium">
                                                                    -₺
                                                                    {formatNumber(
                                                                        item.costShare
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">
                                                                    ₺0
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                                                            <span
                                                                className={
                                                                    item.finalProfit >
                                                                    0
                                                                        ? 'text-green-600 font-semibold'
                                                                        : item.finalProfit <
                                                                          0
                                                                        ? 'text-red-600 font-semibold'
                                                                        : 'text-gray-900'
                                                                }
                                                            >
                                                                {item.finalProfit >
                                                                0
                                                                    ? '+'
                                                                    : ''}
                                                                ₺
                                                                {formatNumber(
                                                                    item.finalProfit
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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
                            {t('settlement.settlementDetails')}
                        </DialogTitle>
                        <DialogDescription>
                            {Number(discount) > 0 ? (
                                <>
                                    {t(
                                        'settlement.sessionCostDistributed',
                                        {
                                            amount: `${formatNumber(
                                                Number(sessionCost)
                                            )}`,
                                        }
                                    )}
                                    <br />
                                    <span className="text-sm text-gray-600">
                                        {t(
                                            'settlement.discountAppliedToAll',
                                            {
                                                discount: `${discount}%`,
                                            }
                                        )}
                                    </span>
                                </>
                            ) : (
                                t(
                                    'settlement.sessionCostDistributed',
                                    {
                                        amount: `${formatNumber(
                                            Number(sessionCost)
                                        )}`,
                                    }
                                )
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto py-4">
                        {sessionCost !== null &&
                            sessionCost !== '' &&
                            calculateSettlement(
                                Number(sessionCost),
                                Number(discount) || 0
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
                                                {t(
                                                    'settlement.original'
                                                )}
                                                :
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
                                                ₺
                                                {formatNumber(
                                                    item.profitLoss
                                                )}
                                            </span>
                                        </div>
                                        {item.discountAmount > 0 && (
                                            <div>
                                                <span className="text-gray-500">
                                                    {t(
                                                        'settlement.discount'
                                                    )}
                                                    :
                                                </span>
                                                <span className="ml-1 font-medium text-orange-600">
                                                    -₺
                                                    {formatNumber(
                                                        item.discountAmount
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500">
                                                {t(
                                                    'settlement.afterDiscount'
                                                )}
                                                :
                                            </span>
                                            <span
                                                className={`ml-1 font-medium ${
                                                    item.adjustedProfitLoss >
                                                    0
                                                        ? 'text-green-600'
                                                        : item.adjustedProfitLoss <
                                                          0
                                                        ? 'text-red-600'
                                                        : ''
                                                }`}
                                            >
                                                {item.adjustedProfitLoss >
                                                0
                                                    ? '+'
                                                    : ''}
                                                ₺
                                                {formatNumber(
                                                    item.adjustedProfitLoss
                                                )}
                                            </span>
                                        </div>
                                        {item.costShare > 0 && (
                                            <div>
                                                <span className="text-gray-500">
                                                    {t(
                                                        'settlement.sessionCost'
                                                    )}
                                                    :
                                                </span>
                                                <span className="ml-1 font-medium text-red-600">
                                                    -₺
                                                    {formatNumber(
                                                        item.costShare
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="sm:col-span-2">
                                            <span className="text-gray-500">
                                                {t(
                                                    'settlement.finalAmount'
                                                )}
                                                :
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
                                                ₺
                                                {formatNumber(
                                                    item.finalProfit
                                                )}
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
                            {t('settlement.close')}
                        </Button>
                        <Button
                            onClick={handleSaveSettlement}
                            disabled={isLoading}
                            className="sm:w-auto"
                        >
                            {isLoading
                                ? t('settlement.saving')
                                : t('settlement.saveSettlement')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
