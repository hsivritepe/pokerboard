import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    Prisma,
    TransactionType,
    SessionStatus,
} from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const gameSession = await prisma.gameSession.findUnique({
            where: { id: id },
        });

        if (!gameSession) {
            return new NextResponse('Session not found', {
                status: 404,
            });
        }

        // Only host or admin can add players
        if (
            !currentUser.isAdmin &&
            gameSession.hostId !== currentUser.id
        ) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Check if session is still ongoing
        if (gameSession.status !== SessionStatus.ONGOING) {
            return NextResponse.json(
                {
                    error: 'Session is not active',
                    messageKey: 'sessionStatus.notActive',
                },
                {
                    status: 400,
                }
            );
        }

        const body = await request.json();
        const { userId, initialBuyIn } = body;

        if (!userId || !initialBuyIn) {
            return new NextResponse('Missing required fields', {
                status: 400,
            });
        }

        // Check if buy-in meets minimum requirement
        if (initialBuyIn < gameSession.buyIn) {
            return new NextResponse(
                `Buy-in must be at least ₺${gameSession.buyIn}`,
                { status: 400 }
            );
        }

        // Check if user is already in the session
        const existingPlayer = await prisma.playerSession.findFirst({
            where: {
                userId,
                sessionId: id,
                status: 'ACTIVE',
            },
        });

        if (existingPlayer) {
            return new NextResponse(
                'User is already in this session',
                {
                    status: 400,
                }
            );
        }

        // Add player to session and create initial buy-in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create player session
            const playerSession = await tx.playerSession.create({
                data: {
                    userId,
                    sessionId: id,
                    initialBuyIn,
                    currentStack: initialBuyIn,
                    status: 'ACTIVE',
                },
            });

            // Create buy-in transaction
            await tx.transaction.create({
                data: {
                    amount: initialBuyIn,
                    type: TransactionType.BUY_IN,
                    userId,
                    sessionId: id,
                    playerSessionId: playerSession.id,
                },
            });

            return playerSession;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error adding player:', error);
        console.error('Error details:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
