'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionStatus } from '@prisma/client';
import { useToast } from '@/app/components/ui/toast-context';

interface SessionActionsProps {
    sessionId: string;
    currentStatus: SessionStatus;
    isHost: boolean;
    isAdmin: boolean;
}

export default function SessionActions({
    sessionId,
    currentStatus,
    isHost,
    isAdmin,
}: SessionActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const handleStatusChange = async (newStatus: SessionStatus) => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/sessions/${sessionId}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                showToast(
                    errorText || 'Failed to update session status',
                    'error'
                );
                return;
            }

            showToast(
                `Session status updated to ${newStatus.toLowerCase()}`,
                'success'
            );
            router.refresh();
        } catch (error) {
            console.error('Error updating session status:', error);
            showToast(
                'An unexpected error occurred. Please try again.',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this session?'
            )
        ) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(
                `/api/sessions/${sessionId}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                showToast('Failed to delete session', 'error');
                return;
            }

            showToast('Session deleted successfully', 'success');
            router.push('/sessions');
        } catch (error) {
            console.error('Error deleting session:', error);
            showToast(
                'Failed to delete session. Please try again.',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {currentStatus === 'ONGOING' && (
                <button
                    onClick={() =>
                        handleStatusChange(
                            'COMPLETED' as SessionStatus
                        )
                    }
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                    End Session
                </button>
            )}

            {(isHost || isAdmin) && (
                <button
                    onClick={handleDeleteSession}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                    Delete Session
                </button>
            )}
        </div>
    );
}
