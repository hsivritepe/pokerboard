import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { message: 'Token is required' },
                { status: 400 }
            );
        }

        // Find user with this reset token
        const whereCondition: Prisma.UserWhereInput = {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date(),
            },
        };

        const user = await prisma.user.findFirst({
            where: whereCondition,
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Token is valid' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            { message: 'Something went wrong' },
            { status: 500 }
        );
    }
}
