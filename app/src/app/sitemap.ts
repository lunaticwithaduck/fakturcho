import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.fakturcho.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          bg: BASE_URL,
          en: `${BASE_URL}/en`,
          'x-default': BASE_URL,
        },
      },
    },
    {
      url: `${BASE_URL}/signup`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/privacy`,
          en: `${BASE_URL}/en/privacy`,
          'x-default': `${BASE_URL}/privacy`,
        },
      },
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/terms`,
          en: `${BASE_URL}/en/terms`,
          'x-default': `${BASE_URL}/terms`,
        },
      },
    },
    {
      url: `${BASE_URL}/refunds`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/refunds`,
          en: `${BASE_URL}/en/refunds`,
          'x-default': `${BASE_URL}/refunds`,
        },
      },
    },
    {
      url: `${BASE_URL}/en`,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          bg: BASE_URL,
          en: `${BASE_URL}/en`,
          'x-default': BASE_URL,
        },
      },
    },
    {
      url: `${BASE_URL}/en/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/privacy`,
          en: `${BASE_URL}/en/privacy`,
          'x-default': `${BASE_URL}/privacy`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/terms`,
          en: `${BASE_URL}/en/terms`,
          'x-default': `${BASE_URL}/terms`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/refunds`,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          bg: `${BASE_URL}/refunds`,
          en: `${BASE_URL}/en/refunds`,
          'x-default': `${BASE_URL}/refunds`,
        },
      },
    },
  ];
}
