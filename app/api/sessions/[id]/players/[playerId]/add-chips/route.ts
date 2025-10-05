import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/utils';

type UserWithAdmin = {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id, playerId } = await params;

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the request body for chip amount
        const body = await request.json();
        const { amount } = body;

        // Validate amount
        if (amount === undefined || isNaN(amount) || amount <= 0) {
            return new NextResponse(
                'Invalid amount. Must be greater than 0',
                { status: 400 }
            );
        }

        // Get user with all fields
        const currentUser = (await prisma.user.findUnique({
            where: { email: session.user.email },
        })) as UserWithAdmin | null;

        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the game session
        const gameSession = await prisma.gameSession.findUnique({
            where: { id },
            include: {
                participants: true,
            },
        });

        if (!gameSession) {
            return new NextResponse('Game session not found', {
                status: 404,
            });
        }

        // Check if user is admin or host
        if (
            !currentUser.isAdmin &&
            gameSession.hostId !== currentUser.id
        ) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Get the player session
        const playerSession = await prisma.playerSession.findUnique({
            where: { id: playerId },
            include: {
                user: true,
            },
        });

        if (!playerSession) {
            return new NextResponse('Player not found', {
                status: 404,
            });
        }

        if (playerSession.status !== 'ACTIVE') {
            return new NextResponse('Player is not active', {
                status: 400,
            });
        }

        // Process the transaction in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update player's stack
            const updatedPlayerSession =
                await prisma.playerSession.update({
                    where: { id: playerId },
                    data: {
                        currentStack: {
                            increment: amount,
                        },
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                });

            // Create transaction record
            await prisma.transaction.create({
                data: {
                    amount: amount,
                    type: 'REBUY',
                    userId: playerSession.userId,
                    sessionId: id,
                    playerSessionId: playerId,
                },
            });

            return updatedPlayerSession;
        });

        return NextResponse.json({
            ...result,
            message: `Added ₺${formatNumber(amount)} to ${
                playerSession.user.name
            }'s stack. New total: ₺${formatNumber(
                playerSession.currentStack + amount
            )}`,
        });
    } catch (error) {
        console.error('Error adding chips:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
