import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    Prisma,
    TransactionType,
    PlayerSessionStatus,
} from '@prisma/client';
import type { PlayerSession } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { date, location, buyIn, players } = data;

        if (!date || !buyIn || !players || players.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const result = await prisma.$transaction(async () => {
            // Create the game session
            const gameSession = await prisma.gameSession.create({
                data: {
                    date: new Date(date),
                    location,
                    buyIn,
                    hostId: user.id,
                },
            });

            // Create player sessions and initial buy-in transactions
            const playerSessions = await Promise.all(
                players.map(
                    async (player: {
                        userId: string;
                        buyIn: number;
                    }) => {
                        // Create player session with nested transaction
                        return prisma.playerSession.create({
                            data: {
                                userId: player.userId,
                                sessionId: gameSession.id,
                                initialBuyIn: player.buyIn,
                                currentStack: player.buyIn,
                                status: 'ACTIVE',
                                transactions: {
                                    create: {
                                        amount: player.buyIn,
                                        type: TransactionType.BUY_IN,
                                        userId: player.userId,
                                        sessionId: gameSession.id,
                                    },
                                },
                            },
                            include: {
                                transactions: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true,
                                    },
                                },
                            },
                        });
                    }
                )
            );

            return {
                gameSession,
                playerSessions,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating game session:', error);
        return NextResponse.json(
            { error: 'Failed to create game session' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const hostId = searchParams.get('hostId');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const where: Prisma.GameSessionWhereInput = {};
        if (status) {
            where.status = status as any;
        }
        if (hostId) {
            where.hostId = hostId;
        }

        const gameSessions = await prisma.gameSession.findMany({
            where,
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true,
                            },
                        },
                        transactions: {
                            select: {
                                id: true,
                                amount: true,
                                type: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        return NextResponse.json(gameSessions);
    } catch (error) {
        console.error('Error fetching game sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch game sessions' },
            { status: 500 }
        );
    }
}
