import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from './components/ui/toast-context';
import { SimpleNavigation } from '@/components/SimpleNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'PokerBoard',
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
                        <SimpleNavigation />
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
