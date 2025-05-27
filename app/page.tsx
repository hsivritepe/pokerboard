import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100">
            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to PokerBoard
                    </h1>
                    <p className="text-xl text-gray-600">
                        Track and manage your private poker games with
                        ease
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/sessions/new"
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Create New Session
                        </h2>
                        <p className="text-gray-600">
                            Start a new poker game session and invite
                            players
                        </p>
                    </Link>

                    <Link
                        href="/sessions"
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            View Sessions
                        </h2>
                        <p className="text-gray-600">
                            Browse and manage your poker game sessions
                        </p>
                    </Link>

                    <Link
                        href="/settlements"
                        className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Settlements
                        </h2>
                        <p className="text-gray-600">
                            View and manage payments between players
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
