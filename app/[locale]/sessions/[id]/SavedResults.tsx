'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { formatNumber } from '@/lib/utils';

interface SavedResultsProps {
    sessionId: string;
}

interface TooltipState {
    [key: string]: boolean;
}

export default function SavedResults({
    sessionId,
}: SavedResultsProps) {
    const t = useTranslations();
    const [savedSettlement, setSavedSettlement] = useState<
        any[] | null
    >(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tooltips, setTooltips] = useState<TooltipState>({});

    useEffect(() => {
        const fetchSavedResults = async () => {
            try {
                const response = await fetch(
                    `/api/sessions/${sessionId}/settlement`
                );
                if (response.ok) {
                    const data = await response.json();
                    if (
                        data.settlementResults &&
                        data.settlementResults.length > 0
                    ) {
                        const formattedSettlements =
                            data.settlementResults.map(
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
                console.error('Error fetching saved results:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedResults();
    }, [sessionId]);

    const abbreviateName = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0].substring(0, 2)} ${parts[1].substring(
                0,
                2
            )}`;
        }
        return name.substring(0, 4);
    };

    const toggleTooltip = (playerId: string) => {
        setTooltips((prev) => ({
            ...prev,
            [playerId]: !prev[playerId],
        }));
    };

    if (isLoading) {
        return (
            <div className="p-2 text-center">
                <p className="text-gray-600">{t('common.loading')}</p>
            </div>
        );
    }

    if (!savedSettlement || savedSettlement.length === 0) {
        return (
            <div className="p-2 text-center">
                <p className="text-gray-600">
                    {t('settlement.noSavedResults')}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {t('common.player')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {t('settlement.profitLoss')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {t('settlement.costShare')}
                        </th>
                        <th
                            scope="col"
                            className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {t('settlement.finalAmount')}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {savedSettlement.map((item) => (
                        <tr key={item.id}>
                            <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 relative">
                                    <span className="sm:hidden">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleTooltip(
                                                    item.id
                                                );
                                            }}
                                            onTouchStart={(e) => {
                                                e.preventDefault();
                                                toggleTooltip(
                                                    item.id
                                                );
                                            }}
                                            className="hover:text-blue-600 transition-colors select-none"
                                            style={{
                                                userSelect: 'none',
                                                WebkitUserSelect:
                                                    'none',
                                            }}
                                        >
                                            {abbreviateName(
                                                item.user.name
                                            )}
                                        </button>
                                        {tooltips[item.id] && (
                                            <div className="absolute top-0 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                                                {item.user.name}
                                            </div>
                                        )}
                                    </span>
                                    <span className="hidden sm:inline">
                                        {item.user.name}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                    className={
                                        item.profitLoss > 0
                                            ? 'text-green-600 font-semibold'
                                            : item.profitLoss < 0
                                            ? 'text-red-600 font-semibold'
                                            : 'text-gray-900'
                                    }
                                >
                                    {item.profitLoss > 0 ? '+' : ''}₺
                                    {formatNumber(item.profitLoss)}
                                </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₺{formatNumber(item.costShare)}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                    className={
                                        item.finalProfit > 0
                                            ? 'text-green-600 font-semibold'
                                            : item.finalProfit < 0
                                            ? 'text-red-600 font-semibold'
                                            : 'text-gray-900'
                                    }
                                >
                                    {item.finalProfit > 0 ? '+' : ''}₺
                                    {formatNumber(item.finalProfit)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
