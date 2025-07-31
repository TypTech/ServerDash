import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
 
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);