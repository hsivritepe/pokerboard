'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SessionStatus } from '@prisma/client';
import { useToast } from '@/app/components/ui/toast-context';
import { useTranslations } from 'next-intl';

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
    const params = useParams();
    const locale = params.locale as string;
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const t = useTranslations();

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
            !window.confirm(t('sessionActions.confirmDeleteSession'))
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
                showToast(
                    t('sessionActions.failedToDeleteSession'),
                    'error'
                );
                return;
            }

            showToast(
                t('sessionActions.sessionDeletedSuccessfully'),
                'success'
            );
            router.push(`/${locale}/sessions`);
        } catch (error) {
            console.error('Error deleting session:', error);
            showToast(
                t('sessionActions.failedToDeleteSessionRetry'),
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
                    {t('sessionActions.deleteSession')}
                </button>
            )}
        </div>
    );
}
