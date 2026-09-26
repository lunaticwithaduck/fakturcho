import { defaultNonEuB2bServicesGround } from '@fakturcho/shared-types';
import type { ClientDto, IssuerProfileDto } from '@shared/types';
import type { ComposerFormState } from './composerState';

// Directive 2006/112/EC art. 44: a business client outside the EU gets the
// country's out-of-scope ground by default, the same way the EU
// reverse-charge case needs no user action — only fires on an actual client
// pick, so switching away and back, or just reopening an existing draft,
// never overwrites a ground the issuer already chose (or didn't) for it.
export function resolveClientChangeDefaults(
  issuerProfile: IssuerProfileDto,
  clients: readonly ClientDto[],
  clientId: string | null,
): Partial<ComposerFormState> {
  if (!issuerProfile.vatRegistered) return {};
  const client = clients.find((candidate) => candidate.id === clientId) ?? null;
  const ground = defaultNonEuB2bServicesGround(issuerProfile.country, issuerProfile.identifiers, {
    country: client?.country ?? null,
    clientType: client?.clientType ?? null,
  });
  return ground ? { chargeVat: false, vatExemptionGround: ground } : {};
}
