import { renderOgImage } from '@og/build-og-image';

export const runtime = 'nodejs';
export const alt = 'Фактурчо — фактури за българския бизнес';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return renderOgImage();
}
