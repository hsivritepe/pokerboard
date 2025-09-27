import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true },
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if user is host or admin
        const gameSession = await prisma.gameSession.findUnique({
            where: { id },
            select: { hostId: true },
        });

        if (!gameSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        if (
            gameSession.hostId !== currentUser.id &&
            !currentUser.isAdmin
        ) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { settlementResults } = body;

        if (!settlementResults || !Array.isArray(settlementResults)) {
            return NextResponse.json(
                { error: 'Invalid settlement results' },
                { status: 400 }
            );
        }

        // Delete existing settlement results for this session
        await prisma.sessionSettlement.deleteMany({
            where: { sessionId: id },
        });

        // Create new settlement results
        const createdSettlements =
            await prisma.sessionSettlement.createMany({
                data: settlementResults.map((result: any) => ({
                    sessionId: id,
                    playerId: result.userId,
                    originalProfitLoss: result.profitLoss,
                    sessionCostShare: result.costShare || 0,
                    finalAmount: result.finalProfit,
                })),
            });

        return NextResponse.json({
            message: 'Settlement results saved successfully',
            count: createdSettlements.count,
        });
    } catch (error) {
        console.error('Error saving settlement results:', error);
        return NextResponse.json(
            { error: 'Failed to save settlement results' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get settlement results for this session
        const settlementResults =
            await prisma.sessionSettlement.findMany({
                where: { sessionId: id },
                include: {
                    player: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

        return NextResponse.json({ settlementResults });
    } catch (error) {
        console.error('Error fetching settlement results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settlement results' },
            { status: 500 }
        );
    }
}
