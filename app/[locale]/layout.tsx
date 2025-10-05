import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SimpleNavigation } from '@/components/SimpleNavigation';

export const metadata = {
    title: 'PokerBoard',
    description:
        'Track and manage your private poker games with ease',
};

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            <SimpleNavigation />
            {children}
        </NextIntlClientProvider>
    );
}
