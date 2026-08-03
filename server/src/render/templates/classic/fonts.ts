import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface EmbeddedFonts {
  regular: string;
  bold: string;
}

let cached: EmbeddedFonts | null = null;

export function loadEmbeddedFonts(): EmbeddedFonts {
  if (cached) return cached;
  const dir = join(process.cwd(), 'assets', 'fonts');
  cached = {
    regular: readFileSync(join(dir, 'NotoSans-Regular.ttf')).toString('base64'),
    bold: readFileSync(join(dir, 'NotoSans-Bold.ttf')).toString('base64'),
  };
  return cached;
}
