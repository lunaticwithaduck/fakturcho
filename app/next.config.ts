import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fakturcho/design', '@fakturcho/shared-types'],
  async rewrites() {
    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${serverUrl}/api/:path*` }];
  },
};

export default nextConfig;
