import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Extend the built-in session types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
            isAdmin?: boolean;
        };
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    console.log(
                        'Attempting to authorize:',
                        credentials?.email
                    );

                    if (
                        !credentials?.email ||
                        !credentials?.password
                    ) {
                        console.log('Missing credentials');
                        throw new Error('Invalid credentials');
                    }

                    const user = await prisma.user.findUnique({
                        where: {
                            email: credentials.email,
                        },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            password: true,
                            isAdmin: true,
                        },
                    });

                    console.log('User found:', user ? 'yes' : 'no');

                    if (!user || !user.password) {
                        console.log('User not found or no password');
                        throw new Error('Invalid credentials');
                    }

                    console.log('Comparing passwords...');
                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );
                    console.log('Password valid:', isValid);

                    if (!isValid) {
                        throw new Error('Invalid credentials');
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        isAdmin: user.isAdmin,
                    };
                } catch (error) {
                    console.error('Authorization error:', error);
                    throw error;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub!;
                session.user.isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
    debug: true,
};
