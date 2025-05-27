import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Prisma } from '@prisma/client';

export default async function SessionsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/signin');
    }

    // Get the current user with their admin status
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
    });

    // Fetch sessions based on user's role
    const sessions = await prisma.gameSession.findMany({
        where: currentUser?.isAdmin
            ? undefined // Admin can see all sessions
            : {
                  OR: [
                      { hostId: session.user.id }, // User is host
                      {
                          participants: {
                              some: {
                                  user: {
                                      id: session.user.id,
                                  },
                              },
                          },
                      }, // User is participant
                  ],
              },
        include: {
            host: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    participants: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Game Sessions
                    </h1>
                    <Link
                        href="/sessions/new"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Create New Session
                    </Link>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {sessions.map((session) => (
                            <li key={session.id}>
                                <Link
                                    href={`/sessions/${session.id}`}
                                    className="block hover:bg-gray-50"
                                >
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {session.location ||
                                                        'No location specified'}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-600">
                                                    Hosted by{' '}
                                                    {
                                                        session.host
                                                            .name
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm text-gray-900">
                                                    {format(
                                                        new Date(
                                                            session.date
                                                        ),
                                                        'PPP p'
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-600">
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            session.date
                                                        ),
                                                        {
                                                            addSuffix:
                                                                true,
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-700">
                                                    {
                                                        session._count
                                                            .participants
                                                    }{' '}
                                                    players
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-700 sm:mt-0">
                                                <p>
                                                    Min Buy-in: $
                                                    {session.buyIn}
                                                </p>
                                                <span className="mx-2">
                                                    •
                                                </span>
                                                <p
                                                    className={`${
                                                        session.status ===
                                                        'ONGOING'
                                                            ? 'text-green-600'
                                                            : session.status ===
                                                              'COMPLETED'
                                                            ? 'text-blue-600'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {session.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {sessions.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No sessions found.{' '}
                                <Link
                                    href="/sessions/new"
                                    className="text-indigo-600 hover:text-indigo-500"
                                >
                                    Create your first session
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
