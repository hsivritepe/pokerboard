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
                host: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!gameSession) {
            return new NextResponse('Game session not found', {
                status: 404,
            });
        }

        // Get the session cost and discount using a raw query
        const sessionCostResult = (await prisma.$queryRaw`
            SELECT "sessionCost", "discount" FROM "GameSession" WHERE id = ${id}
        `) as Array<{
            sessionCost: number | null;
            discount: number | null;
        }>;

        // Add the session cost and discount to the response
        const sessionWithCost = {
            ...gameSession,
            sessionCost: sessionCostResult[0]?.sessionCost || null,
            discount: sessionCostResult[0]?.discount || 0,
        };

        // Check if user has access to this session
        const hasAccess =
            currentUser.isAdmin ||
            gameSession.hostId === currentUser.id;

        if (!hasAccess) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return NextResponse.json(sessionWithCost);
    } catch (error) {
        console.error('Error fetching session:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await context.params;

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

        const gameSession = await prisma.gameSession.findUnique({
            where: { id },
            select: { hostId: true },
        });

        if (!gameSession) {
            return new NextResponse('Session not found', {
                status: 404,
            });
        }

        // Only host or admin can delete session
        if (
            !currentUser.isAdmin &&
            gameSession.hostId !== currentUser.id
        ) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Delete all related records first
        await prisma.$transaction([
            // Delete all participant records
            prisma.playerSession.deleteMany({
                where: { sessionId: id },
            }),
            // Delete the game session
            prisma.gameSession.delete({
                where: { id },
            }),
        ]);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting session:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
