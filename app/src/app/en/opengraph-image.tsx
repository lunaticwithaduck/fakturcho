import { renderOgImage } from '@og/build-og-image';

export const runtime = 'nodejs';
export const alt = 'Fakturcho — invoicing and e-invoicing for EU businesses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return renderOgImage({
    brand: 'Fakturcho',
    tagline: 'Invoicing and e-invoicing for EU businesses',
  });
}
