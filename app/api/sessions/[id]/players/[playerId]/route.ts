import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; playerId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the current user
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true },
        });

        if (!currentUser) {
            return new NextResponse('User not found', {
                status: 404,
            });
        }

        const { id, playerId } = await params;

        // Get the player session with related data
        const playerSession = await prisma.playerSession.findUnique({
            where: { id: playerId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                session: {
                    select: {
                        id: true,
                        date: true,
                        location: true,
                        status: true,
                        hostId: true,
                        buyIn: true,
                        host: {
                            select: {
                                name: true,
                            },
                        },
                        participants: {
                            select: {
                                id: true,
                                initialBuyIn: true,
                                currentStack: true,
                                status: true,
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                            orderBy: {
                                joinedAt: 'desc',
                            },
                        },
                    },
                },
                transactions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!playerSession) {
            return new NextResponse('Player session not found', {
                status: 404,
            });
        }

        // Check if user has access to this session
        const hasAccess =
            currentUser.isAdmin ||
            playerSession.session.hostId === currentUser.id ||
            playerSession.userId === currentUser.id;

        if (!hasAccess) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return NextResponse.json(playerSession);
    } catch (error) {
        console.error('Error fetching player session:', error);
        return new NextResponse(
            error instanceof Error
                ? error.message
                : 'Internal Server Error',
            { status: 500 }
        );
    }
}
