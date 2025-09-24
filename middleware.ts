import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createIntlMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'fr', 'de', 'tr'],

    // Used when no locale matches
    defaultLocale: 'en',
});

export default async function middleware(request: NextRequest) {
    // First, handle internationalization
    const intlResponse = intlMiddleware(request);

    // If intl middleware returns a redirect, follow it
    if (intlResponse.status === 307 || intlResponse.status === 308) {
        return intlResponse;
    }

    const pathname = request.nextUrl.pathname;

    // Extract locale from pathname
    const locale = pathname.split('/')[1];
    const supportedLocales = ['en', 'es', 'fr', 'de', 'tr'];
    const currentLocale = supportedLocales.includes(locale)
        ? locale
        : 'en';

    // Remove locale from pathname for route checking
    const pathWithoutLocale =
        pathname.replace(`/${currentLocale}`, '') || '/';

    // Define public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/auth/signin',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/api/auth',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/verify-reset-token',
        '/api/auth/fix-password',
    ];

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(
        (route) =>
            pathWithoutLocale === route ||
            pathWithoutLocale.startsWith(route + '/')
    );

    // If it's a public route, continue with the request
    if (isPublicRoute) {
        return intlResponse;
    }

    // For protected routes, check authentication
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token (user not authenticated), redirect to signin
    if (!token) {
        const signInUrl = new URL(
            `/${currentLocale}/auth/signin`,
            request.url
        );
        signInUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(signInUrl);
    }

    // User is authenticated, continue with the request
    return intlResponse;
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(de|en|es|fr|tr)/:path*'],
};
