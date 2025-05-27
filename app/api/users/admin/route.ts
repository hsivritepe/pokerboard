import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Make the user an admin
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { isAdmin: true },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error making user admin:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
