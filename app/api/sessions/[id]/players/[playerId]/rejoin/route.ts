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

        // Get the request body for additional buy-in amount
        const body = await request.json();
        const { additionalBuyIn } = body;

        if (
            additionalBuyIn !== undefined &&
            (isNaN(additionalBuyIn) || additionalBuyIn < 0)
        ) {
            return new NextResponse('Invalid buy-in amount', {
                status: 400,
            });
        }

        // First, get the player session to check if it exists and its status
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

        if (playerSession.status === 'ACTIVE') {
            return new NextResponse('Player is already active', {
                status: 400,
            });
        }

        // Calculate new stack amount
        const newStack =
            additionalBuyIn !== undefined
                ? playerSession.currentStack + additionalBuyIn
                : playerSession.currentStack;

        // Update the player session
        const updatedPlayerSession =
            await prisma.playerSession.update({
                where: { id: playerId },
                data: {
                    status: 'ACTIVE',
                    leftAt: null,
                    currentStack: newStack,
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

        // If there's an additional buy-in, create a transaction record
        if (additionalBuyIn && additionalBuyIn > 0) {
            await prisma.transaction.create({
                data: {
                    amount: additionalBuyIn,
                    type: 'REBUY',
                    userId: playerSession.userId,
                    sessionId: id,
                    playerSessionId: playerId,
                },
            });
        }

        const message =
            additionalBuyIn && additionalBuyIn > 0
                ? `Player has rejoined the game with ₺${formatNumber(
                      updatedPlayerSession.currentStack
                  )} chips (added ₺${formatNumber(additionalBuyIn)})`
                : `Player has rejoined the game with ₺${formatNumber(
                      updatedPlayerSession.currentStack
                  )} chips`;

        return NextResponse.json({
            ...updatedPlayerSession,
            message,
        });
    } catch (error) {
        console.error('Error in rejoin player API:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
