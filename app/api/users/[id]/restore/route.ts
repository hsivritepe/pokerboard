import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

        // Check if user exists and is deleted
        const user = await prisma.user.findUnique({
            where: { id: id },
        });

        if (!user) {
            return new NextResponse('User not found', {
                status: 404,
            });
        }

        if (!user.isDeleted) {
            return new NextResponse('User is not deleted', {
                status: 400,
            });
        }

        // Restore the user
        await prisma.user.update({
            where: { id: id },
            data: {
                isDeleted: false,
                deletedAt: null,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error restoring user:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
