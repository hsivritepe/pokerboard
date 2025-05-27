import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, User } from '@prisma/client';
import crypto from 'crypto';

type UserWithPlayerSessions = {
    id: string;
    name: string | null;
    email: string | null;
    isDeleted: boolean;
    playerSessions: {
        initialBuyIn: number;
        currentStack: number;
    }[];
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check if the current user is an admin or host
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true },
        });

        if (!currentUser?.isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return new NextResponse('Missing required fields', {
                status: 400,
            });
        }

        // Check if user with email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse(
                'User with this email already exists',
                {
                    status: 400,
                }
            );
        }

        // Hash the password
        const hashedPassword = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        // Create the user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return new NextResponse('Internal Server Error', {
            status: 500,
        });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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

        // Debugging: Log available fields in the User model
        console.log(
            'Available fields in User model:',
            prisma.user.fields
        );

        // Get all users with their player sessions
        const users = await prisma.user.findMany({
            where: {}, // Include all users, both deleted and non-deleted
            select: {
                id: true,
                name: true,
                email: true,
                isDeleted: true,
                playerSessions: {
                    select: {
                        initialBuyIn: true,
                        currentStack: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Calculate statistics for each user
        const usersWithStats = users.map((user) => {
            const totalGames = user.playerSessions.length;
            const totalBuyIns = user.playerSessions.reduce(
                (sum, session) => sum + session.initialBuyIn,
                0
            );
            const totalCashouts = user.playerSessions.reduce(
                (sum, session) => sum + session.currentStack,
                0
            );
            const netProfit = totalCashouts - totalBuyIns;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                isDeleted: user.isDeleted,
                totalGames,
                totalBuyIns,
                totalCashouts,
                netProfit,
            };
        });

        return NextResponse.json(usersWithStats);
    } catch (error) {
        console.error('Error fetching users:', error);
        return new NextResponse(
            error instanceof Error
                ? error.message
                : 'Internal Server Error',
            { status: 500 }
        );
    }
}
