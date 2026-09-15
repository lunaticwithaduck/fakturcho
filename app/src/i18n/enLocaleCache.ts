import { getFeatureFlags } from '../feature-flags';

const TTL_MS = 60_000;

let cached: { value: boolean; expiresAt: number } | null = null;

export async function isEnLocaleEnabled(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const flags = await getFeatureFlags();
  cached = { value: flags.EN_LOCALE, expiresAt: Date.now() + TTL_MS };
  return cached.value;
}

export function resetEnLocaleCache(): void {
  cached = null;
}
