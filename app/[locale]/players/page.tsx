'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import {
    TrashIcon,
    PlusIcon,
    ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/components/ui/toast-context';

interface PlayerSession {
    id: string;
    initialBuyIn: number;
    currentStack: number;
}

interface User {
    id: string;
    name: string | null;
    email: string | null;
    playerSessions: PlayerSession[];
}

interface PlayerStats {
    id: string;
    name: string | null;
    email: string | null;
    totalGames: number;
    totalBuyIns: number;
    totalCashouts: number;
    netProfit: number;
    isDeleted: boolean;
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface UsersResponse {
    users: PlayerStats[];
    pagination: PaginationInfo;
}

type SortField =
    | 'name'
    | 'totalGames'
    | 'totalBuyIns'
    | 'totalCashouts'
    | 'netProfit';
type SortOrder = 'asc' | 'desc';

type Props = {
    params: Promise<{ locale: string }>;
};

export default function PlayersPage({ params }: Props) {
    const { data: session, status } = useSession();
    const resolvedParams = use(params);
    const currentLocale = resolvedParams.locale;
    const router = useRouter();
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(true);
    const [players, setPlayers] = useState<PlayerStats[]>([]);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] =
        useState<PlayerStats | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [playerToRestore, setPlayerToRestore] =
        useState<PlayerStats | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] =
        useState<PaginationInfo | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push(`/${currentLocale}/auth/signin`);
            return;
        }

        const fetchPlayers = async () => {
            try {
                setIsLoading(true);
                setError(null); // Reset error state
                const response = await fetch(
                    `/api/users?page=${currentPage}&limit=50`
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    if (response.status === 403) {
                        throw new Error(
                            'You do not have permission to view this page.'
                        );
                    }
                    throw new Error(
                        errorText || 'Failed to fetch players'
                    );
                }

                const data: UsersResponse = await response.json();
                if (!data.users || !Array.isArray(data.users)) {
                    throw new Error('Invalid response format');
                }

                setPlayers(data.users);
                setPagination(data.pagination);
            } catch (err) {
                console.error('Error fetching players:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching players.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayers();
    }, [session, status, router, currentPage]);

    const handleDeleteClick = (player: PlayerStats) => {
        setPlayerToDelete(player);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!playerToDelete) return;

        try {
            setIsDeleting(true);
            const response = await fetch(
                `/api/users/${playerToDelete.id}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    errorText || 'Failed to delete player'
                );
            }

            setPlayers((prevPlayers) =>
                prevPlayers.map((p) =>
                    p.id === playerToDelete.id
                        ? { ...p, isDeleted: true }
                        : p
                )
            );
            setDeleteModalOpen(false);
            setPlayerToDelete(null);
            showToast(
                t('players.playerDeletedSuccessfully'),
                'success'
            );
        } catch (err) {
            console.error('Error deleting player:', err);
            showToast(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete player',
                'error'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreatePlayer = async () => {
        if (!newPlayerName.trim()) {
            showToast(t('toast.pleaseEnterPlayerName'), 'error');
            return;
        }

        try {
            setIsCreating(true);
            const response = await fetch('/api/users/quick-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newPlayerName.trim(),
                    email: newPlayerEmail.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const newPlayer = await response.json();
            setPlayers((prev) => [
                ...prev,
                {
                    id: newPlayer.id,
                    name: newPlayer.name,
                    email: newPlayer.email,
                    totalGames: 0,
                    totalBuyIns: 0,
                    totalCashouts: 0,
                    netProfit: 0,
                    isDeleted: false,
                },
            ]);

            setIsCreateModalOpen(false);
            setNewPlayerName('');
            setNewPlayerEmail('');
            showToast(
                t('toast.playerCreatedSuccessfully'),
                'success'
            );
        } catch (error) {
            console.error('Error creating player:', error);
            showToast(
                error instanceof Error
                    ? error.message
                    : 'Failed to create player',
                'error'
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleUndeleteClick = (player: PlayerStats) => {
        setPlayerToRestore(player);
        setRestoreModalOpen(true);
    };

    const handleRestoreConfirm = async () => {
        if (!playerToRestore) return;

        try {
            setIsRestoring(true);
            const response = await fetch(
                `/api/users/${playerToRestore.id}/undelete`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(
                    errorData || 'Failed to restore player'
                );
            }

            setPlayers((prevPlayers) =>
                prevPlayers.map((p) =>
                    p.id === playerToRestore.id
                        ? { ...p, isDeleted: false }
                        : p
                )
            );
            setRestoreModalOpen(false);
            setPlayerToRestore(null);
            showToast(
                t('players.playerRestoredSuccessfully'),
                'success'
            );
        } catch (err) {
            console.error('Error restoring player:', err);
            showToast(
                err instanceof Error
                    ? err.message
                    : 'Failed to restore player',
                'error'
            );
        } finally {
            setIsRestoring(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 bg-gray-200 rounded"
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-xl font-semibold text-red-600 mb-2">
                        {error}
                    </h1>
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-900"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedPlayers = [...players]
        .sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (
                typeof aValue === 'string' &&
                typeof bValue === 'string'
            ) {
                return multiplier * aValue.localeCompare(bValue);
            }
            return multiplier * (Number(aValue) - Number(bValue));
        })
        .filter((player) => showDeleted || !player.isDeleted);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (field !== sortField) return null;
        return (
            <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                {t('players.title')}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('players.description')}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="showDeleted"
                                    checked={showDeleted}
                                    onChange={(e) =>
                                        setShowDeleted(
                                            e.target.checked
                                        )
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="showDeleted"
                                    className="ml-2 block text-sm text-gray-900"
                                >
                                    {t('players.showDeletedPlayers')}
                                </label>
                            </div>
                            <Button
                                onClick={() =>
                                    setIsCreateModalOpen(true)
                                }
                                className="flex items-center gap-2"
                            >
                                <PlusIcon className="h-5 w-5" />
                                {t('players.addPlayer')}
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                            handleSort('name')
                                        }
                                    >
                                        {t('players.player')}
                                        <SortIcon field="name" />
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                            handleSort('totalGames')
                                        }
                                    >
                                        {t('players.totalGames')}
                                        <SortIcon field="totalGames" />
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                            handleSort('totalBuyIns')
                                        }
                                    >
                                        {t('players.totalBuyIns')}
                                        <SortIcon field="totalBuyIns" />
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                            handleSort(
                                                'totalCashouts'
                                            )
                                        }
                                    >
                                        {t('players.totalCashouts')}
                                        <SortIcon field="totalCashouts" />
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() =>
                                            handleSort('netProfit')
                                        }
                                    >
                                        {t('players.netProfitLoss')}
                                        <SortIcon field="netProfit" />
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {t('players.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedPlayers.map((player) => (
                                    <tr
                                        key={player.id}
                                        className={
                                            player.isDeleted
                                                ? 'bg-gray-50'
                                                : ''
                                        }
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {player.name}
                                                {player.isDeleted && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        {t(
                                                            'players.delete'
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {player.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {player.totalGames}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₺{player.totalBuyIns}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₺{player.totalCashouts}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`text-sm font-medium ${
                                                    player.netProfit >
                                                    0
                                                        ? 'text-green-600'
                                                        : player.netProfit <
                                                          0
                                                        ? 'text-red-600'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                ₺{player.netProfit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <Link
                                                href={`/${currentLocale}/players/${player.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                {t(
                                                    'common.viewDetails'
                                                )}
                                            </Link>
                                            {!player.isDeleted ? (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            player
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5 inline" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleUndeleteClick(
                                                            player
                                                        )
                                                    }
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <ArrowUturnLeftIcon className="h-5 w-5 inline" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {(pagination.page - 1) *
                                            pagination.limit +
                                            1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(
                                            pagination.page *
                                                pagination.limit,
                                            pagination.totalCount
                                        )}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">
                                        {pagination.totalCount}
                                    </span>{' '}
                                    results
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentPage(
                                                currentPage - 1
                                            )
                                        }
                                        disabled={
                                            !pagination.hasPrev ||
                                            isLoading
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                                        Page {pagination.page} of{' '}
                                        {pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentPage(
                                                currentPage + 1
                                            )
                                        }
                                        disabled={
                                            !pagination.hasNext ||
                                            isLoading
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Player Modal */}
            <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('players.addNewPlayer')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('players.createNewPlayerDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="name">
                                {t('players.nameRequired')}
                            </Label>
                            <Input
                                id="name"
                                value={newPlayerName}
                                onChange={(e) =>
                                    setNewPlayerName(e.target.value)
                                }
                                placeholder={t('players.playerName')}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">
                                {t('players.emailOptional')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={newPlayerEmail}
                                onChange={(e) =>
                                    setNewPlayerEmail(e.target.value)
                                }
                                placeholder={t(
                                    'players.emailPlaceholder'
                                )}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsCreateModalOpen(false)
                            }
                            disabled={isCreating}
                        >
                            {t('playerManagement.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreatePlayer}
                            disabled={
                                isCreating || !newPlayerName.trim()
                            }
                        >
                            {isCreating
                                ? t('players.creating')
                                : t('players.createPlayer')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setPlayerToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title={t('players.delete')}
                message={t('players.confirmDeletePlayer')}
                confirmButtonText={
                    isDeleting
                        ? t('players.creating')
                        : t('players.delete')
                }
                isDanger={true}
            />

            {/* Restore Confirmation Modal */}
            <Dialog
                open={restoreModalOpen}
                onOpenChange={setRestoreModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('players.restore')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('players.confirmRestorePlayer')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRestoreModalOpen(false);
                                setPlayerToRestore(null);
                            }}
                            disabled={isRestoring}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestoreConfirm}
                            disabled={isRestoring}
                        >
                            {isRestoring
                                ? t('players.creating')
                                : t('players.restore')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
