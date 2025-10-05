import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

type UserWithAdmin = {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
};

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!playerId) {
            return new NextResponse('Player ID is required', {
                status: 400,
            });
        }

        // Get user with all fields
        const currentUser = (await prisma.user.findUnique({
            where: { email: session.user.email },
        })) as UserWithAdmin | null;

        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the game session with all participants and their transactions
        const gameSession = await prisma.gameSession.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        transactions: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
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

        // Count active players
        const activePlayers = gameSession.participants.filter(
            (p) => p.status === 'ACTIVE'
        );

        // If this is not the last active player, return false
        if (
            activePlayers.length !== 1 ||
            activePlayers[0].id !== playerId
        ) {
            return NextResponse.json({
                isLastPlayer: false,
            });
        }

        // Calculate total buy-ins for all players
        const totalBuyIns = gameSession.participants.reduce(
            (sum, player) => {
                const buyInTransactions =
                    player.transactions?.filter(
                        (t) =>
                            t.type === 'BUY_IN' || t.type === 'REBUY'
                    ) || [];

                const playerTotalBuyIn =
                    buyInTransactions.length > 0
                        ? buyInTransactions.reduce(
                              (sum, t) => sum + t.amount,
                              0
                          )
                        : player.initialBuyIn;

                return sum + playerTotalBuyIn;
            },
            0
        );

        // Calculate total cash out for settled players
        const totalCashOut = gameSession.participants
            .filter((p) => p.status === 'CASHED_OUT')
            .reduce((sum, player) => sum + player.currentStack, 0);

        // Calculate what this player should cash out with to maintain balance
        const requiredCashOut = totalBuyIns - totalCashOut;

        // Return the required cash out amount
        return NextResponse.json({
            isLastPlayer: true,
            requiredCashOut:
                requiredCashOut > 0 ? requiredCashOut : 0,
            totalBuyIns,
            totalCashOut,
        });
    } catch (error) {
        console.error('Error in balance info API:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
