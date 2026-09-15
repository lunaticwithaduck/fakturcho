import { COMPANY } from '@app/features/legal/company';
import type { MetadataRoute } from 'next';
import { BACKGROUND_COLOR, THEME_COLOR } from '../../theme-colors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COMPANY.productName} — фактури за българския бизнес`,
    short_name: COMPANY.productName,
    start_url: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    lang: 'bg',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
