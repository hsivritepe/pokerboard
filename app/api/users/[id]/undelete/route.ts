import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log(
            'Undelete request received for user ID:',
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

        // Check if user exists
        const userToUndelete = await prisma.user.findUnique({
            where: { id: id },
            select: {
                id: true,
                isDeleted: true,
            },
        });

        if (!userToUndelete) {
            return new NextResponse('User not found', {
                status: 404,
            });
        }

        if (!userToUndelete.isDeleted) {
            return new NextResponse('User is not deleted', {
                status: 400,
            });
        }

        try {
            // Undelete the user using raw SQL
            await prisma.$executeRaw`
                UPDATE "User"
                SET "isDeleted" = false,
                    "deletedAt" = NULL
                WHERE id = ${id}
            `;

            console.log('Undelete successful for user:', id);
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
