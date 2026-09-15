import type { FeatureFlagsDto } from '@shared/types';
import { API_ROUTES } from '@shared/types';

const ALL_OFF: FeatureFlagsDto = { EN_LOCALE: false, EINVOICE: false, PEPPOL: false };

/**
 * Server-side only: reads the runtime feature flags from the API. Fails soft
 * — an unreachable or erroring API leaves every flag off rather than
 * throwing, since a layout render should never break on this.
 */
export async function getFeatureFlags(): Promise<FeatureFlagsDto> {
  try {
    const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3001';
    const response = await fetch(`${serverUrl}${API_ROUTES.featureFlags}`, { cache: 'no-store' });
    if (!response.ok) return ALL_OFF;
    const flags = (await response.json()) as Partial<FeatureFlagsDto> | null;
    return {
      EN_LOCALE: flags?.EN_LOCALE === true,
      EINVOICE: flags?.EINVOICE === true,
      PEPPOL: flags?.PEPPOL === true,
    };
  } catch {
    return ALL_OFF;
  }
}
