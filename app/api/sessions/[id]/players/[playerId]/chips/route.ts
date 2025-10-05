import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; playerId: string }> }
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

        const { id, playerId } = await params;

        const playerSession = await prisma.playerSession.findUnique({
            where: { id: playerId },
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
        const { amount, type = TransactionType.REBUY } = body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return new NextResponse('Invalid amount', {
                status: 400,
            });
        }

        // Add chips to player's stack and create transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update player's stack
            const updatedPlayerSession =
                await tx.playerSession.update({
                    where: { id: playerId },
                    data: {
                        currentStack: {
                            increment: amount,
                        },
                    },
                });

            // Create transaction record
            const transaction = await tx.transaction.create({
                data: {
                    amount,
                    type,
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
        console.error('Error adding chips:', error);
        console.error('Error details:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
