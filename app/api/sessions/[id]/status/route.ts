import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { SessionStatus, PlayerSession } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;

        const gameSession = await prisma.gameSession.findUnique({
            where: { id: id },
            include: {
                participants: true,
                host: true,
            },
        });

        if (!gameSession) {
            return new NextResponse('Session not found', {
                status: 404,
            });
        }

        // Only host or admin can update session status
        if (
            !currentUser.isAdmin &&
            gameSession.hostId !== currentUser.id
        ) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await request.json();
        const newStatus = body.status as SessionStatus;

        if (!Object.values(SessionStatus).includes(newStatus)) {
            return new NextResponse('Invalid status', {
                status: 400,
            });
        }

        // Check if trying to complete the session
        if (newStatus === 'COMPLETED') {
            // Check if all players are cashed out
            const activePlayersCount =
                gameSession.participants.filter(
                    (player: PlayerSession) =>
                        player.status === 'ACTIVE'
                ).length;

            if (activePlayersCount > 0) {
                return new NextResponse(
                    'Cannot complete session: There are still active players. All players must cash out before ending the session.',
                    { status: 400 }
                );
            }
        }

        const updatedSession = await prisma.gameSession.update({
            where: { id: id },
            data: { status: newStatus },
        });

        return NextResponse.json(updatedSession);
    } catch (error) {
        console.error('Error updating session status:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
