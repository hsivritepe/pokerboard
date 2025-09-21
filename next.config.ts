import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const config = {
    output: 'standalone',
    reactStrictMode: true,
};

export default withNextIntl(config);
