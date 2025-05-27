import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Navigation } from '@/components/Navigation';
import { ToastProvider } from './components/ui/toast-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'PokerBoard - Track Your Home Games',
    description:
        'Track and manage your private poker games with ease',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <ToastProvider>
                        <Navigation />
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
