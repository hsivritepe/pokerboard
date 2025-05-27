import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

type UserWithAdmin = User & {
    isAdmin: boolean;
};

export async function POST(request: Request) {
    try {
        // Check if user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const currentUser = (await prisma.user.findUnique({
            where: { email: session.user.email },
        })) as UserWithAdmin | null;

        if (!currentUser) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { name, email } = body;

        if (!name) {
            return new NextResponse('Name is required', {
                status: 400,
            });
        }

        // Check if email is provided and if it's already in use
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return new NextResponse('Email already in use', {
                    status: 400,
                });
            }
        }

        // Create new user with a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        try {
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email:
                        email ||
                        `temp_${Date.now()}@pokerboard.local`,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            });

            return NextResponse.json(newUser);
        } catch (dbError) {
            console.error('Database error creating user:', dbError);
            return new NextResponse(
                'Failed to create user in database. Please try again.',
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in quick-create endpoint:', error);
        return new NextResponse(
            'Internal Server Error - Please try again',
            { status: 500 }
        );
    }
}
