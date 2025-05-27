import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        console.log('Received password reset request for:', email);

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user first to avoid unnecessary token generation
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!existingUser) {
            console.log('No user found with email:', email);
            // Don't reveal user existence
            return NextResponse.json(
                {
                    message:
                        'If an account exists, a password reset link will be sent',
                },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        console.log('Generated reset token for user:', email);

        try {
            // Update user with reset token
            const user = await prisma.user.update({
                where: { email },
                data: {
                    resetToken,
                    resetTokenExpiry,
                },
            });

            // Generate reset link
            const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
            console.log('Reset link generated:', resetLink);

            // Send password reset email
            try {
                const emailTemplate =
                    emailTemplates.passwordReset(resetLink);
                const emailResult = await sendEmail({
                    to: email,
                    ...emailTemplate,
                });
                console.log(
                    'Password reset email sent successfully:',
                    emailResult
                );

                // For development, also log the reset link
                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        'Development mode - Password reset link:',
                        resetLink
                    );
                }

                return NextResponse.json(
                    {
                        message:
                            'If an account exists, a password reset link will be sent',
                    },
                    { status: 200 }
                );
            } catch (emailError) {
                console.error(
                    'Failed to send password reset email:',
                    emailError
                );
                // Revert the token update since email failed
                await prisma.user.update({
                    where: { email },
                    data: {
                        resetToken: null,
                        resetTokenExpiry: null,
                    },
                });
                return NextResponse.json(
                    { error: 'Failed to send password reset email' },
                    { status: 500 }
                );
            }
        } catch (updateError) {
            console.error(
                'Failed to update user with reset token:',
                updateError
            );
            return NextResponse.json(
                { error: 'Failed to process password reset request' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
