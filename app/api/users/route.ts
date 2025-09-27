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

        // Parse query parameters for pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // Use a single optimized query with database aggregation and pagination
        // This query efficiently calculates all statistics in the database without loading unnecessary data
        const usersWithStats = (await prisma.$queryRaw`
            SELECT
                u.id,
                u.name,
                u.email,
                u."isDeleted",
                COUNT(ps.id) as "totalGames",
                COALESCE(SUM(ps."initialBuyIn"), 0) as "totalBuyIns",
                COALESCE(SUM(ps."currentStack"), 0) as "totalCashouts",
                COALESCE(SUM(ps."currentStack"), 0) - COALESCE(SUM(ps."initialBuyIn"), 0) as "netProfit"
            FROM "User" u
            LEFT JOIN "PlayerSession" ps ON u.id = ps."userId"
            GROUP BY u.id, u.name, u.email, u."isDeleted"
            ORDER BY u.name ASC
            LIMIT ${limit} OFFSET ${offset}
        `) as Array<{
            id: string;
            name: string | null;
            email: string | null;
            isDeleted: boolean;
            totalGames: bigint;
            totalBuyIns: number;
            totalCashouts: number;
            netProfit: number;
        }>;

        // Get total count for pagination
        const totalCountResult = (await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM "User"
        `) as Array<{ count: bigint }>;
        const totalCount = Number(totalCountResult[0].count);

        // Convert BigInt to number for JSON serialization
        const usersWithCalculatedStats = usersWithStats.map(
            (user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                isDeleted: user.isDeleted,
                totalGames: Number(user.totalGames),
                totalBuyIns: user.totalBuyIns,
                totalCashouts: user.totalCashouts,
                netProfit: user.netProfit,
            })
        );

        return NextResponse.json({
            users: usersWithCalculatedStats,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1,
            },
        });
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
