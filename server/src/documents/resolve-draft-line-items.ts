import type { LineItemInput, VatCategory } from '@fakturcho/shared-types';
import { getCountryConfig, PL_GROUND_VAT_CATEGORIES } from '@fakturcho/shared-types';
import { hasValidVatNumberFormat, resolveLineVatCategory } from '../vat-eu/reverse-charge';
import type { VatTreatment } from './vat-treatment';

// Categories that are never charged VAT by definition (Z/K/G are always
// zero-rated; AE/O/E carry no charged rate either) — an unset line rate
// defaults to 0 for all of them, never the issuer's standard rate.
const ZERO_RATE_CATEGORIES: ReadonlySet<VatCategory> = new Set(['AE', 'O', 'E', 'G', 'K', 'Z']);

// PL: a document-level ground maps to a specific FA(3) box (see
// PL_GROUND_VAT_CATEGORIES) — export is 'G', an intra-EU supply of goods is
// 'K', international transport is 'Z', and both not-subject-to-VAT grounds
// are 'O'; only the true exemption grounds (art. 43 ust. 1 pkt ... and the
// small-business ground) fall back to 'E'. Every other country still has a
// single not-charged category ('O') for any manually- or auto-selected
// ground, since no equivalent per-ground mapping has been verified for them.
function resolveNotChargedVatCategory(issuerCountry: string, ground: string | null): VatCategory {
  if (issuerCountry === 'PL' && ground) {
    return PL_GROUND_VAT_CATEGORIES.get(ground) ?? 'E';
  }
  return 'O';
}

export interface ResolveDraftLineItemsInput {
  lineItems: readonly LineItemInput[];
  issuerCountry: string;
  issuerVatRegistered: boolean;
  issuerIdentifiers: Record<string, string>;
  client: {
    country: string | null;
    postcode: string | null;
    eik: string | null;
    vatNumber: string | null;
    clientType: 'business' | 'consumer' | null;
  } | null;
  vat: VatTreatment;
}

export type ResolvedDraftLineItem = LineItemInput & { vatCategory: VatCategory; vatRateBp: number };

// An unset line vatCategory/vatRateBp defaults from the issuer/client context;
// a line that already carries either explicitly (an existing draft's own
// stored line) is left untouched, so reopening one never silently recomputes it.
export function resolveDraftLineItems(input: ResolveDraftLineItemsInput): ResolvedDraftLineItem[] {
  const { lineItems, issuerCountry, issuerVatRegistered, issuerIdentifiers, client, vat } = input;
  // client.country is a required, defaulted column on the Prisma record (see
  // schema.prisma) — the `?? 'BG'` only guards this generalized type's
  // nullability, it never actually fires for a real client.
  const clientHasValidVatNumber = client
    ? hasValidVatNumberFormat(client.vatNumber, client.country ?? 'BG')
    : false;

  return lineItems.map((line) => {
    const vatCategory =
      line.vatCategory !== undefined
        ? line.vatCategory
        : !vat.vatCharged
          ? resolveNotChargedVatCategory(issuerCountry, vat.vatExemptionGround)
          : resolveLineVatCategory(
              issuerCountry,
              client?.country ?? null,
              undefined,
              clientHasValidVatNumber,
              issuerVatRegistered,
            );
    const vatRateBp =
      line.vatRateBp !== undefined
        ? line.vatRateBp
        : ZERO_RATE_CATEGORIES.has(vatCategory)
          ? 0
          : getCountryConfig(issuerCountry, issuerIdentifiers, {
              country: client?.country ?? null,
              postcode: client?.postcode ?? null,
              clientType: client?.clientType ?? null,
              eik: client?.eik ?? null,
            }).defaultVatRateBp;

    return { ...line, vatCategory, vatRateBp };
  });
}
