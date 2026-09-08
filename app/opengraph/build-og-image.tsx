import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from 'next/og';

const WIDTH = 1200;
const HEIGHT = 630;

const SURFACE = '#ffffff';
const SURFACE_SUNKEN = '#eef0f3';
const ACCENT = '#1d4fd8';
const TEXT_MUTED = '#5c6472';

async function readAsset(relativePath: string): Promise<Buffer> {
  return readFile(fileURLToPath(new URL(relativePath, import.meta.url)));
}

export async function renderOgImage(): Promise<ImageResponse> {
  const [interRegular, interBold, brandIcon] = await Promise.all([
    readAsset('../src/app/fonts/Inter-Regular.ttf'),
    readAsset('../src/app/fonts/Inter-Bold.ttf'),
    readAsset('../src/features/shell/brand-icon.png'),
  ]);
  const brandIconSrc = `data:image/png;base64,${brandIcon.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 32,
        width: '100%',
        height: '100%',
        padding: 80,
        backgroundColor: SURFACE,
        backgroundImage: `linear-gradient(135deg, ${SURFACE} 0%, ${SURFACE_SUNKEN} 100%)`,
        fontFamily: 'Inter',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <img src={brandIconSrc} alt="" width={96} height={96} style={{ borderRadius: 24 }} />
        <span style={{ fontSize: 56, fontWeight: 700, color: ACCENT }}>Фактурчо</span>
      </div>
      <span style={{ fontSize: 40, fontWeight: 400, color: TEXT_MUTED }}>
        Фактури за българския бизнес
      </span>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
      ],
    },
  );
}
