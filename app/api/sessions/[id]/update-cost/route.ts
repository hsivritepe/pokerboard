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

export async function POST(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const id = context.params.id;

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the request body for session cost
        const body = await request.json();
        const { sessionCost } = body;

        // Validate sessionCost
        if (
            sessionCost === undefined ||
            isNaN(sessionCost) ||
            sessionCost < 0
        ) {
            return new NextResponse('Invalid session cost', {
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

        // Get the game session
        const gameSession = await prisma.gameSession.findUnique({
            where: { id },
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

        // Update the session cost
        const updatedSession = await prisma.$executeRaw`
            UPDATE "GameSession"
            SET "sessionCost" = ${sessionCost}
            WHERE id = ${id}
        `;

        return NextResponse.json({
            messageKey: 'sessionCost.updated',
            messageParams: { amount: `₺${sessionCost.toFixed(2)}` },
            sessionCost: sessionCost,
        });
    } catch (error) {
        console.error('Error updating session cost:', error);

        // More detailed error logging
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
