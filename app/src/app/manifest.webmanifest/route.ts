import { BG_MANIFEST } from '@app/features/pwa/buildManifest';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(BG_MANIFEST, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
