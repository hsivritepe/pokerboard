import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatNumber } from '@/lib/utils';
import { Prisma } from '@prisma/client';

type UserWithAdmin = {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
};

export async function POST(
    request: Request,
    context: { params: { id: string; playerId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const id = context.params.id;
        const playerId = context.params.playerId;

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the request body for leave amount
        const body = await request.json();
        const { leaveAmount } = body;

        console.log('Leave request received:', {
            playerId,
            leaveAmount,
        });

        // Validate leaveAmount
        if (
            leaveAmount === undefined ||
            isNaN(leaveAmount) ||
            leaveAmount < 0
        ) {
            console.log('Invalid leave amount:', leaveAmount);
            return new NextResponse('Invalid leave amount', {
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

        // Get the player session
        const playerSession = await prisma.playerSession.findUnique({
            where: { id: playerId },
            include: {
                user: true,
                transactions: true,
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

        // Count active players
        const activePlayers = gameSession.participants.filter(
            (p) => p.status === 'ACTIVE'
        );

        // If this is the last active player or second-to-last active player, check if the cash out amount maintains balance
        if (activePlayers.length <= 2) {
            // Calculate total buy-ins for all players
            const totalBuyIns = gameSession.participants.reduce(
                (sum, player) => {
                    const buyInTransactions =
                        player.transactions?.filter(
                            (t) =>
                                t.type === 'BUY_IN' ||
                                t.type === 'REBUY'
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
                .reduce(
                    (sum, player) => sum + player.currentStack,
                    0
                );

            // Calculate what this player should cash out with to maintain balance
            const requiredCashOut = totalBuyIns - totalCashOut;

            // If the requested leave amount is significantly different from the required amount
            if (Math.abs(leaveAmount - requiredCashOut) > 0.01) {
                console.log(
                    'Warning: Cash out amount does not maintain balance'
                );
                console.log(
                    'Required cash out amount:',
                    requiredCashOut
                );
                console.log(
                    'Requested cash out amount:',
                    leaveAmount
                );

                // If this is the last active player, enforce the required cash out amount
                if (activePlayers.length === 1) {
                    return new NextResponse(
                        `To maintain balance, the last player must cash out with ₺${requiredCashOut.toFixed(
                            2
                        )}. Please use this amount instead.`,
                        { status: 400 }
                    );
                }
            }
        }

        console.log(
            'Player initial buy-in:',
            playerSession.initialBuyIn
        );
        console.log(
            'Player current stack:',
            playerSession.currentStack
        );
        console.log('Requested leave amount:', leaveAmount);

        // Update the player session
        const updatedPlayerSession =
            await prisma.playerSession.update({
                where: { id: playerId },
                data: {
                    status: 'CASHED_OUT',
                    leftAt: new Date(),
                    currentStack: leaveAmount, // Update to the specified leave amount
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

        // Calculate profit/loss for the message
        const profitLoss = leaveAmount - playerSession.initialBuyIn;
        const profitLossText =
            profitLoss >= 0
                ? `+₺${formatNumber(profitLoss)}`
                : `-₺${formatNumber(Math.abs(profitLoss))}`;

        console.log(
            'Player successfully left with amount:',
            leaveAmount
        );
        console.log('Profit/Loss:', profitLoss);

        return NextResponse.json({
            ...updatedPlayerSession,
            message: `Player has left the game with ₺${leaveAmount.toFixed(
                2
            )} (${profitLossText})`,
        });
    } catch (error) {
        console.error('Error in leave player API:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
