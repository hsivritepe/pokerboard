import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            );
        }

        // Find user by reset token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password and clear reset token
        const updateData: Prisma.UserUpdateInput = {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        };

        await prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });

        return NextResponse.json(
            { message: 'Password reset successful' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
