import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const sessionId = searchParams.get('sessionId');

        if (!query) {
            return NextResponse.json([]);
        }

        // Build the where clause
        const whereClause: any = {
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
            ],
        };

        // If sessionId is provided, exclude users already in that session
        if (sessionId) {
            whereClause.NOT = {
                playerSessions: {
                    some: {
                        sessionId: sessionId,
                    },
                },
            };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 10,
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}
