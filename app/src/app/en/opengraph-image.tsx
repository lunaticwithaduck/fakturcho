import { renderOgImage } from '@og/build-og-image';

export const runtime = 'nodejs';
export const alt = 'Fakturcho — invoicing for Bulgarian businesses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return renderOgImage({
    brand: 'Fakturcho',
    tagline: 'Invoicing for Bulgarian businesses',
  });
}
