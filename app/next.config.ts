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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
