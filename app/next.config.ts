import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fakturcho/design', '@fakturcho/shared-types'],
};

export default nextConfig;
