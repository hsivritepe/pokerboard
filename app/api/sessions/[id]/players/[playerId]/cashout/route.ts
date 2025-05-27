import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: { id: string; playerId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true },
        });

        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const playerSession = await prisma.playerSession.findUnique({
            where: { id: params.playerId },
            include: {
                session: true,
                user: true,
            },
        });

        if (!playerSession) {
            return new NextResponse('Player session not found', {
                status: 404,
            });
        }

        // Check if user has permission (host, admin, or self)
        const hasPermission =
            currentUser.isAdmin ||
            playerSession.session.hostId === currentUser.id ||
            playerSession.userId === currentUser.id;

        if (!hasPermission) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Check if player is still active
        if (playerSession.status !== 'ACTIVE') {
            return new NextResponse('Player is not active', {
                status: 400,
            });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return new NextResponse('Invalid amount', {
                status: 400,
            });
        }

        // Check if player has enough chips
        if (amount > playerSession.currentStack) {
            return new NextResponse(
                'Not enough chips in current stack',
                {
                    status: 400,
                }
            );
        }

        // Process cash out in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update player's stack and status
            const updatedPlayerSession =
                await tx.playerSession.update({
                    where: { id: params.playerId },
                    data: {
                        currentStack: {
                            decrement: amount,
                        },
                        status:
                            amount === playerSession.currentStack
                                ? 'CASHED_OUT'
                                : 'ACTIVE',
                        leftAt:
                            amount === playerSession.currentStack
                                ? new Date()
                                : undefined,
                    },
                });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    amount,
                    type: TransactionType.CASH_OUT,
                    userId: playerSession.userId,
                    sessionId: playerSession.sessionId,
                    playerSessionId: playerSession.id,
                },
            });

            return {
                playerSession: updatedPlayerSession,
                transaction,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error cashing out:', error);
        console.error('Error details:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
