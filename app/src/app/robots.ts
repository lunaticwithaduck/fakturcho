import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/documents',
        '/clients',
        '/catalogue',
        '/profile',
        '/billing',
        '/primitives',
        '/api',
      ],
    },
    sitemap: 'https://www.fakturcho.com/sitemap.xml',
  };
}
