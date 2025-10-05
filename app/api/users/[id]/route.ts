import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log(
            'Delete request received for user ID:',
            'will be extracted from params'
        );

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        // Check if the user is an admin
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                isAdmin: true,
            },
        });

        if (!currentUser?.isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Check if user exists and get their sessions
        const userToDelete = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                playerSessions: {
                    where: {
                        OR: [
                            { status: 'ACTIVE' },
                            { session: { status: 'ONGOING' } },
                        ],
                    },
                    select: { id: true },
                },
                hostedSessions: {
                    where: {
                        status: 'ONGOING',
                    },
                    select: { id: true },
                },
            },
        });

        console.log('User to delete:', userToDelete);

        if (!userToDelete) {
            return new NextResponse('User not found', {
                status: 404,
            });
        }

        // Check if user has any active sessions
        if (userToDelete.playerSessions.length > 0) {
            return new NextResponse(
                'Cannot delete user with active sessions',
                { status: 400 }
            );
        }

        // Check if user is hosting any ongoing sessions
        if (userToDelete.hostedSessions.length > 0) {
            return new NextResponse(
                'Cannot delete user who is hosting ongoing sessions',
                { status: 400 }
            );
        }

        try {
            // Soft delete the user using raw SQL
            await prisma.$executeRaw`
                UPDATE "User"
                SET "isDeleted" = true,
                    "deletedAt" = NOW()
                WHERE id = ${id}
            `;

            console.log('Soft delete successful for user:', id);
            return new NextResponse(null, { status: 204 });
        } catch (error) {
            console.error('Database error:', error);
            if (
                error instanceof Prisma.PrismaClientKnownRequestError
            ) {
                console.error('Prisma Error Details:', {
                    code: error.code,
                    message: error.message,
                    meta: error.meta,
                });
            }
            return new NextResponse('Failed to update user', {
                status: 500,
            });
        }
    } catch (error) {
        console.error('Outer error handler:', error);
        return new NextResponse(
            error instanceof Error
                ? error.message
                : 'Internal Server Error',
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        // Check if the user is an admin
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                isAdmin: true,
            },
        });

        if (!currentUser?.isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Get the player with their sessions
        const player = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                email: true,
                isDeleted: true,
                playerSessions: {
                    include: {
                        session: {
                            select: {
                                id: true,
                                date: true,
                                location: true,
                                status: true,
                                buyIn: true,
                            },
                        },
                        transactions: {
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'desc',
                    },
                },
            },
        });

        if (!player) {
            return new NextResponse('Player not found', {
                status: 404,
            });
        }

        return NextResponse.json(player);
    } catch (error) {
        console.error('Error fetching player:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
