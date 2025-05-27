import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        // Validate input
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // Send welcome email
        try {
            const emailTemplate = emailTemplates.welcome(name);
            const emailResult = await sendEmail({
                to: email,
                ...emailTemplate,
            });
            console.log(
                'Welcome email sent successfully:',
                emailResult
            );
        } catch (emailError) {
            console.error(
                'Failed to send welcome email:',
                emailError
            );
            // Don't return error response as registration was successful
        }

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
