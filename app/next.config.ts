import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@fakturcho/design', '@fakturcho/shared-types'],
  outputFileTracingIncludes: {
    '/opengraph-image': ['./src/app/fonts/**', './src/features/shell/brand-icon.png'],
    '/twitter-image': ['./src/app/fonts/**', './src/features/shell/brand-icon.png'],
  },
  async rewrites() {
    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${serverUrl}/api/:path*` }];
  },
};

export default nextConfig;
